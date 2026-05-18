terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "fitcheck-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "fitcheck-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags { tags = local.common_tags }
}

locals {
  common_tags = {
    Project     = "FitCheck"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

variable "aws_region"   { default = "us-east-1" }
variable "environment"  { default = "production" }
variable "db_password"  { sensitive = true }
variable "redis_auth"   { sensitive = true }

# ─────────────────────────────────────────
# VPC
# ─────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name    = "fitcheck-vpc-${var.environment}"
  cidr    = "10.0.0.0/16"

  azs              = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true
  create_database_subnet_group = true
}

# ─────────────────────────────────────────
# RDS PostgreSQL with pgvector
# ─────────────────────────────────────────
resource "aws_db_instance" "fitcheck_postgres" {
  identifier = "fitcheck-postgres-${var.environment}"

  engine               = "postgres"
  engine_version       = "16.2"
  instance_class       = "db.r6g.large"
  allocated_storage    = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "fitcheck"
  username = "fitcheck"
  password = var.db_password

  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = true
  publicly_accessible    = false
  deletion_protection    = true
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = false
  final_snapshot_identifier = "fitcheck-final-${var.environment}"

  performance_insights_enabled = true
  monitoring_interval          = 60

  parameter_group_name = aws_db_parameter_group.fitcheck.name
}

resource "aws_db_parameter_group" "fitcheck" {
  name   = "fitcheck-pg16-${var.environment}"
  family = "postgres16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,vector"
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "500"
  }
}

# ─────────────────────────────────────────
# ElastiCache Redis
# ─────────────────────────────────────────
resource "aws_elasticache_replication_group" "fitcheck_redis" {
  replication_group_id = "fitcheck-redis-${var.environment}"
  description          = "FitCheck Redis cluster"

  node_type            = "cache.r6g.large"
  num_cache_clusters   = 3
  port                 = 6379
  parameter_group_name = "default.redis7"

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth

  subnet_group_name = aws_elasticache_subnet_group.fitcheck.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = true
  multi_az_enabled           = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
}

resource "aws_elasticache_subnet_group" "fitcheck" {
  name       = "fitcheck-redis-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

# ─────────────────────────────────────────
# S3 + CloudFront CDN
# ─────────────────────────────────────────
resource "aws_s3_bucket" "fitcheck_media" {
  bucket = "fitcheck-media-${var.environment}"
}

resource "aws_s3_bucket_versioning" "fitcheck_media" {
  bucket = aws_s3_bucket.fitcheck_media.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_cors_configuration" "fitcheck_media" {
  bucket = aws_s3_bucket.fitcheck_media.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["https://app.fitcheck.ai"]
    max_age_seconds = 3600
  }
}

resource "aws_cloudfront_distribution" "fitcheck_cdn" {
  origin {
    domain_name = aws_s3_bucket.fitcheck_media.bucket_regional_domain_name
    origin_id   = "fitcheck-s3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.fitcheck.cloudfront_access_identity_path
    }
  }

  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  default_cache_behavior {
    target_origin_id       = "fitcheck-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
    compress    = true
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_cloudfront_origin_access_identity" "fitcheck" {
  comment = "FitCheck media CDN OAI"
}

# ─────────────────────────────────────────
# ECS Fargate
# ─────────────────────────────────────────
resource "aws_ecs_cluster" "fitcheck" {
  name = "fitcheck-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "fitcheck-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "2048"
  memory                   = "4096"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.fitcheck_api.repository_url}:latest"
      essential = true
      portMappings = [{ containerPort = 4000, protocol = "tcp" }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/fitcheck/api"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      secrets = [
        { name = "DATABASE_URL",          valueFrom = aws_ssm_parameter.db_url.arn },
        { name = "JWT_ACCESS_SECRET",     valueFrom = aws_ssm_parameter.jwt_access.arn },
        { name = "JWT_REFRESH_SECRET",    valueFrom = aws_ssm_parameter.jwt_refresh.arn },
        { name = "OPENAI_API_KEY",        valueFrom = aws_ssm_parameter.openai_key.arn },
        { name = "STRIPE_SECRET_KEY",     valueFrom = aws_ssm_parameter.stripe_key.arn },
        { name = "REDIS_HOST",            valueFrom = aws_ssm_parameter.redis_host.arn },
        { name = "REDIS_PASSWORD",        valueFrom = aws_ssm_parameter.redis_password.arn },
      ]

      environment = [
        { name = "NODE_ENV",    value = "production" },
        { name = "S3_BUCKET",   value = aws_s3_bucket.fitcheck_media.id },
        { name = "AWS_REGION",  value = var.aws_region },
      ]
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "fitcheck-api"
  cluster         = aws_ecs_cluster.fitcheck.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle { ignore_changes = [desired_count] }
}

# ─────────────────────────────────────────
# Application Load Balancer
# ─────────────────────────────────────────
resource "aws_lb" "fitcheck" {
  name               = "fitcheck-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.fitcheck_media.id
    prefix  = "alb-logs"
    enabled = true
  }
}

resource "aws_lb_target_group" "api" {
  name        = "fitcheck-api-${var.environment}"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "api" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.fitcheck.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = 2
  max_capacity       = 50
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "fitcheck-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = "ecs"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension

  target_tracking_scaling_policy_configuration {
    target_value = 70
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ─────────────────────────────────────────
# ECR
# ─────────────────────────────────────────
resource "aws_ecr_repository" "fitcheck_api" {
  name                 = "fitcheck-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "AES256" }
}

resource "aws_ecr_lifecycle_policy" "fitcheck_api" {
  repository = aws_ecr_repository.fitcheck_api.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 20 images"
      selection = { tagStatus = "untagged", countType = "imageCountMoreThan", countNumber = 20 }
      action = { type = "expire" }
    }]
  })
}

# ─────────────────────────────────────────
# Security Groups
# ─────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "fitcheck-alb-${var.environment}"
  vpc_id      = module.vpc.vpc_id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "api" {
  name   = "fitcheck-api-${var.environment}"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "rds" {
  name   = "fitcheck-rds-${var.environment}"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }
}

resource "aws_security_group" "redis" {
  name   = "fitcheck-redis-${var.environment}"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }
}

# Placeholder SSM parameters (values set via CI/CD)
resource "aws_ssm_parameter" "db_url"         { name = "/fitcheck/DB_URL"; type = "SecureString"; value = "placeholder" }
resource "aws_ssm_parameter" "jwt_access"     { name = "/fitcheck/JWT_ACCESS"; type = "SecureString"; value = "placeholder" }
resource "aws_ssm_parameter" "jwt_refresh"    { name = "/fitcheck/JWT_REFRESH"; type = "SecureString"; value = "placeholder" }
resource "aws_ssm_parameter" "openai_key"     { name = "/fitcheck/OPENAI_KEY"; type = "SecureString"; value = "placeholder" }
resource "aws_ssm_parameter" "stripe_key"     { name = "/fitcheck/STRIPE_KEY"; type = "SecureString"; value = "placeholder" }
resource "aws_ssm_parameter" "redis_host"     { name = "/fitcheck/REDIS_HOST"; type = "String"; value = aws_elasticache_replication_group.fitcheck_redis.primary_endpoint_address }
resource "aws_ssm_parameter" "redis_password" { name = "/fitcheck/REDIS_PASSWORD"; type = "SecureString"; value = "placeholder" }

resource "aws_cloudwatch_log_group" "redis" { name = "/fitcheck/redis"; retention_in_days = 30 }

# IAM roles (minimal, expand in production)
resource "aws_iam_role" "ecs_execution" {
  name = "fitcheck-ecs-execution-${var.environment}"
  assume_role_policy = jsonencode({ Version = "2012-10-17"; Statement = [{ Effect = "Allow"; Principal = { Service = "ecs-tasks.amazonaws.com" }; Action = "sts:AssumeRole" }] })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "fitcheck-ecs-task-${var.environment}"
  assume_role_policy = jsonencode({ Version = "2012-10-17"; Statement = [{ Effect = "Allow"; Principal = { Service = "ecs-tasks.amazonaws.com" }; Action = "sts:AssumeRole" }] })
}
