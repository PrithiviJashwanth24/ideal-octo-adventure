<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header" id="site-header">
    <div class="container">
        <div class="header-inner">
            <a href="<?php echo esc_url(home_url('/')); ?>" class="site-logo">
                <?php
                if ( has_custom_logo() ) {
                    the_custom_logo();
                } else { ?>
                    <span class="site-logo-text">Blesstech</span>
                <?php } ?>
            </a>

            <nav class="nav-menu" id="nav-menu" aria-label="Primary navigation">
                <?php wp_nav_menu([
                    'theme_location' => 'primary',
                    'container'      => false,
                    'items_wrap'     => '%3$s',
                    'fallback_cb'    => function() { ?>
                        <a href="#services">Services</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#case-studies">Case Studies</a>
                        <a href="#about">About</a>
                    <?php },
                ]); ?>
                <a href="#contact" class="btn btn-primary nav-cta">Get Started</a>
            </nav>

            <button class="hamburger" id="hamburger" aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </div>
</header>
