<?php get_header(); ?>

<main>

<!-- ══ HERO ══════════════════════════════════════════════════ -->
<section class="hero" id="hero">
    <div class="hero-bg"></div>
    <div class="hero-grid-lines"></div>
    <div class="container">
        <div class="hero-content">
            <div class="hero-badge fade-up">
                <span class="hero-badge-dot"></span>
                SAP Gold Partner &mdash; Trusted by 500+ Businesses
            </div>
            <h1 class="fade-up">
                Your Business,<br>
                <span>Engineered to<br>Scale.</span>
            </h1>
            <p class="hero-sub fade-up">
                Blesstech implements SAP Business One in weeks — not months. Unify your finance, inventory, CRM and analytics on one intelligent platform.
            </p>
            <div class="hero-actions fade-up">
                <a href="#contact" class="btn btn-primary btn-lg">Book Free Consultation</a>
                <a href="#reel" class="btn btn-outline btn-lg">Watch Our Story</a>
            </div>
            <div class="hero-stats fade-up">
                <div class="stat-item">
                    <span class="stat-number">500+</span>
                    <span class="stat-label">Businesses Transformed</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">6 Wks</span>
                    <span class="stat-label">Avg. Implementation</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">98%</span>
                    <span class="stat-label">Client Satisfaction</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">15+</span>
                    <span class="stat-label">Years Experience</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ══ SERVICES ═══════════════════════════════════════════════ -->
<section class="section" id="services">
    <div class="container">
        <div class="section-header fade-up">
            <span class="section-label">What We Do</span>
            <h2 class="section-title">Everything Your Business Needs.<br><span class="text-gold">In One Platform.</span></h2>
            <p class="section-sub">SAP Business One covers every critical business function — from the first sale to final report.</p>
        </div>
        <div class="features-grid">
            <div class="feature-card fade-up">
                <div class="feature-icon">💰</div>
                <h3>Finance & Accounting</h3>
                <p>Real-time financial visibility. Automate AP/AR, budgeting, multi-currency, and compliance reporting across all entities.</p>
            </div>
            <div class="feature-card fade-up">
                <div class="feature-icon">📦</div>
                <h3>Inventory Management</h3>
                <p>Eliminate stockouts and overstock. Track inventory across warehouses with automated replenishment and lot/serial control.</p>
            </div>
            <div class="feature-card fade-up">
                <div class="feature-icon">🤝</div>
                <h3>CRM & Sales</h3>
                <p>Manage your entire sales pipeline in SAP. Quotes, orders, deliveries — all connected with zero manual data entry.</p>
            </div>
            <div class="feature-card fade-up">
                <div class="feature-icon">📊</div>
                <h3>Analytics & BI</h3>
                <p>Executive dashboards with live data. Make decisions in minutes, not days. Pre-built reports for every department.</p>
            </div>
            <div class="feature-card fade-up">
                <div class="feature-icon">🏭</div>
                <h3>Manufacturing</h3>
                <p>Production orders, BOMs, MRP, and quality control. Keep production on schedule and costs under control.</p>
            </div>
            <div class="feature-card fade-up">
                <div class="feature-icon">🔗</div>
                <h3>Integrations</h3>
                <p>Connect SAP B1 to your ecommerce, payroll, 3PL, and any third-party system via our pre-built connector library.</p>
            </div>
        </div>
    </div>
</section>

<!-- ══ REEL / VIDEO CTA ════════════════════════════════════════ -->
<section class="section reel-section" id="reel">
    <div class="container">
        <div class="reel-inner">
            <div class="reel-video-wrap fade-up">
                <?php
                $reel_url = get_template_directory_uri() . '/../../output/blesstech_reel.mp4';
                // Check if output video exists at a known path
                ?>
                <video
                    id="brand-reel"
                    src="<?php echo esc_url($reel_url); ?>"
                    poster="<?php echo esc_url(get_template_directory_uri() . '/images/reel-thumb.jpg'); ?>"
                    playsinline
                    muted
                    loop
                ></video>
                <div class="reel-play-btn" id="reel-play">
                    <div class="play-icon">&#9654;</div>
                </div>
            </div>
            <div class="reel-content fade-up">
                <span class="section-label">Our Story</span>
                <h2>See Why 500+ Businesses<br><span class="text-gold">Chose Blesstech</span></h2>
                <p>Watch our 30-second brand reel — built with the same cinematic production quality we bring to every client project. We don't just implement software. We transform how businesses operate.</p>
                <a href="#contact" class="btn btn-primary">Start Your Transformation</a>
            </div>
        </div>
    </div>
</section>

<!-- ══ HOW IT WORKS ════════════════════════════════════════════ -->
<section class="section" id="how-it-works" style="background:var(--dark);">
    <div class="container">
        <div class="section-header fade-up">
            <span class="section-label">The Process</span>
            <h2 class="section-title">From Signed Contract to<br><span class="text-gold">Live in 6 Weeks</span></h2>
            <p class="section-sub">Our battle-tested implementation methodology gets you live faster with less disruption.</p>
        </div>
        <div class="process-steps">
            <div class="step-card fade-up">
                <div class="step-number">1</div>
                <h3>Discovery</h3>
                <p>Deep-dive into your business processes. We map every workflow before writing a line of config.</p>
            </div>
            <div class="step-card fade-up">
                <div class="step-number">2</div>
                <h3>Design</h3>
                <p>Blueprint your SAP environment. Custom workflows, reports, and integrations scoped and approved.</p>
            </div>
            <div class="step-card fade-up">
                <div class="step-number">3</div>
                <h3>Build</h3>
                <p>Our certified SAP consultants configure and test. You review at every milestone.</p>
            </div>
            <div class="step-card fade-up">
                <div class="step-number">4</div>
                <h3>Train</h3>
                <p>Role-based training for every user. We don't go live until your team is confident.</p>
            </div>
            <div class="step-card fade-up">
                <div class="step-number">5</div>
                <h3>Go Live</h3>
                <p>Hypercare launch support. We're on-call for 30 days post go-live to ensure zero disruptions.</p>
            </div>
        </div>
    </div>
</section>

<!-- ══ TESTIMONIALS ════════════════════════════════════════════ -->
<section class="section" id="case-studies">
    <div class="container">
        <div class="section-header fade-up">
            <span class="section-label">Client Results</span>
            <h2 class="section-title">Real Businesses.<br><span class="text-gold">Real Results.</span></h2>
        </div>
        <div class="testimonials-grid">
            <div class="testimonial-card fade-up">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-text">"Blesstech took us from 3 disconnected systems to one unified SAP platform in 5 weeks. Our month-end close went from 8 days to 2 days."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">AK</div>
                    <div class="author-info">
                        <h4>Ahmed Khalil</h4>
                        <p>CFO, Meridian Distribution</p>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-up">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-text">"We scaled from 50 to 300 SKUs without adding a single headcount to our ops team. SAP B1 via Blesstech made us 4x more efficient."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">SR</div>
                    <div class="author-info">
                        <h4>Sarah Rahman</h4>
                        <p>COO, TechBridge Manufacturing</p>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-up">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-text">"The ROI was visible in month one. Inventory accuracy jumped from 67% to 99%. We recovered the entire implementation cost in the first quarter."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">MJ</div>
                    <div class="author-info">
                        <h4>Michael Jensen</h4>
                        <p>CEO, Apex Retail Group</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ══ CTA BANNER ══════════════════════════════════════════════ -->
<section class="section cta-section" id="about">
    <div class="container">
        <h2 class="fade-up">Stop Running Your Business<br><span class="text-gold">on Spreadsheets.</span></h2>
        <p class="fade-up" style="max-width:600px;margin:16px auto 40px;">Join 500+ companies that made the switch to SAP Business One with Blesstech. The implementation pays for itself — usually within the first quarter.</p>
        <div class="cta-actions fade-up">
            <a href="#contact" class="btn btn-primary btn-lg">Book Free Consultation</a>
            <a href="mailto:info@blesstech.com" class="btn btn-outline btn-lg">Email Us Directly</a>
        </div>
    </div>
</section>

<!-- ══ CONTACT ═════════════════════════════════════════════════ -->
<section class="section" id="contact" style="background:var(--dark);">
    <div class="container">
        <div class="contact-grid">
            <div class="contact-info fade-up">
                <span class="section-label">Get In Touch</span>
                <h2>Let's Build Your<br><span class="text-gold">SAP Roadmap</span></h2>
                <p>Tell us about your business. Our SAP consultants will design a custom implementation plan — free, no obligation.</p>
                <div class="contact-detail">
                    <div class="contact-detail-icon">✉</div>
                    <span>info@blesstech.com</span>
                </div>
                <div class="contact-detail">
                    <div class="contact-detail-icon">📞</div>
                    <span>+1 (234) 567-890</span>
                </div>
                <div class="contact-detail">
                    <div class="contact-detail-icon">🌐</div>
                    <span>www.blesstech.com</span>
                </div>
                <div class="contact-detail">
                    <div class="contact-detail-icon">🏆</div>
                    <span>SAP Certified Gold Partner</span>
                </div>
            </div>

            <div class="fade-up">
                <form class="contact-form" id="contact-form">
                    <?php wp_nonce_field('blesstech_nonce', 'nonce'); ?>
                    <div class="form-group">
                        <label for="cf-name">Full Name *</label>
                        <input type="text" id="cf-name" name="name" placeholder="John Smith" required>
                    </div>
                    <div class="form-group">
                        <label for="cf-email">Work Email *</label>
                        <input type="email" id="cf-email" name="email" placeholder="john@company.com" required>
                    </div>
                    <div class="form-group">
                        <label for="cf-company">Company Name</label>
                        <input type="text" id="cf-company" name="company" placeholder="Acme Corp">
                    </div>
                    <div class="form-group">
                        <label for="cf-service">Primary Interest</label>
                        <select id="cf-service" name="service">
                            <option value="">Select a service...</option>
                            <option>SAP B1 Implementation</option>
                            <option>Finance & Accounting Module</option>
                            <option>Inventory & Warehouse</option>
                            <option>CRM & Sales Automation</option>
                            <option>Analytics & Reporting</option>
                            <option>Manufacturing Module</option>
                            <option>System Integration</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cf-message">Tell Us About Your Business *</label>
                        <textarea id="cf-message" name="message" placeholder="Current systems, pain points, team size, timeline..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;">
                        Send Message &rarr;
                    </button>
                    <div id="form-status" style="display:none;padding:14px 18px;border-radius:10px;font-size:0.95rem;margin-top:8px;"></div>
                </form>
            </div>
        </div>
    </div>
</section>

</main>

<?php get_footer(); ?>
