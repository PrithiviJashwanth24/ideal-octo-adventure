<?php
/**
 * Blesstech Theme Functions
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'BLESSTECH_VERSION', '1.0.0' );
define( 'BLESSTECH_DIR', get_template_directory() );
define( 'BLESSTECH_URI', get_template_directory_uri() );

// ── Theme Setup ────────────────────────────────────────────────
function blesstech_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'gallery', 'caption' ] );
    add_theme_support( 'custom-logo', [
        'height'      => 80,
        'width'       => 280,
        'flex-width'  => true,
        'flex-height' => true,
    ] );

    register_nav_menus( [
        'primary' => __( 'Primary Navigation', 'blesstech' ),
        'footer'  => __( 'Footer Navigation', 'blesstech' ),
    ] );

    add_image_size( 'hero', 1920, 1080, true );
    add_image_size( 'card', 800, 500, true );
    add_image_size( 'avatar', 200, 200, true );
}
add_action( 'after_setup_theme', 'blesstech_setup' );

// ── Assets ─────────────────────────────────────────────────────
function blesstech_assets() {
    // Google Fonts
    wp_enqueue_style(
        'blesstech-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
        [],
        null
    );
    // Theme stylesheet
    wp_enqueue_style( 'blesstech-style', get_stylesheet_uri(), [], BLESSTECH_VERSION );
    // Font Awesome
    wp_enqueue_style(
        'font-awesome',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
        [], '6.5.0'
    );
    // Theme JS
    wp_enqueue_script(
        'blesstech-js',
        BLESSTECH_URI . '/js/main.js',
        [], BLESSTECH_VERSION, true
    );
    wp_localize_script( 'blesstech-js', 'blesstech', [
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'blesstech_nonce' ),
    ] );
}
add_action( 'wp_enqueue_scripts', 'blesstech_assets' );

// ── Contact Form AJAX ──────────────────────────────────────────
function blesstech_handle_contact() {
    check_ajax_referer( 'blesstech_nonce', 'nonce' );

    $name    = sanitize_text_field( $_POST['name'] ?? '' );
    $email   = sanitize_email( $_POST['email'] ?? '' );
    $company = sanitize_text_field( $_POST['company'] ?? '' );
    $service = sanitize_text_field( $_POST['service'] ?? '' );
    $message = sanitize_textarea_field( $_POST['message'] ?? '' );

    if ( ! $name || ! is_email( $email ) || ! $message ) {
        wp_send_json_error( 'Please fill in all required fields.' );
    }

    $subject = "New Lead: {$name} from {$company} — {$service}";
    $body    = "Name: {$name}\nEmail: {$email}\nCompany: {$company}\nService: {$service}\n\nMessage:\n{$message}";
    $headers = [ 'Content-Type: text/plain; charset=UTF-8', "Reply-To: {$email}" ];

    $sent = wp_mail( get_option( 'admin_email' ), $subject, $body, $headers );

    if ( $sent ) {
        wp_send_json_success( 'Thank you! We will contact you within 24 hours.' );
    } else {
        wp_send_json_error( 'Could not send message. Please email us directly.' );
    }
}
add_action( 'wp_ajax_blesstech_contact', 'blesstech_handle_contact' );
add_action( 'wp_ajax_nopriv_blesstech_contact', 'blesstech_handle_contact' );

// ── Custom Post Type: Case Studies ─────────────────────────────
function blesstech_register_cpts() {
    register_post_type( 'case_study', [
        'labels'      => [
            'name'          => 'Case Studies',
            'singular_name' => 'Case Study',
        ],
        'public'      => true,
        'has_archive' => true,
        'supports'    => [ 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ],
        'menu_icon'   => 'dashicons-awards',
        'rewrite'     => [ 'slug' => 'case-studies' ],
        'show_in_rest' => true,
    ] );
}
add_action( 'init', 'blesstech_register_cpts' );

// ── Widgets ────────────────────────────────────────────────────
function blesstech_register_widgets() {
    register_sidebar( [
        'id'            => 'footer-1',
        'name'          => 'Footer Column 1',
        'before_widget' => '<div class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="widget-title">',
        'after_title'   => '</h4>',
    ] );
}
add_action( 'widgets_init', 'blesstech_register_widgets' );

// ── SEO Meta Tags ──────────────────────────────────────────────
function blesstech_seo_meta() {
    ?>
    <meta name="description" content="<?php echo esc_attr( get_bloginfo('description') ); ?>">
    <meta property="og:title" content="<?php wp_title('|', true, 'right'); ?>">
    <meta property="og:description" content="Blesstech — SAP Business One Implementation Partner. Transform your business with enterprise-grade ERP in weeks, not months.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="<?php echo esc_url( BLESSTECH_URI . '/images/og-image.jpg' ); ?>">
    <meta name="twitter:card" content="summary_large_image">
    <?php
}
add_action( 'wp_head', 'blesstech_seo_meta' );

// ── Body Classes ───────────────────────────────────────────────
function blesstech_body_classes( $classes ) {
    if ( is_front_page() ) $classes[] = 'is-home';
    if ( is_singular() )   $classes[] = 'is-singular';
    return $classes;
}
add_filter( 'body_class', 'blesstech_body_classes' );
