<?php

return [
    'services' => [
        'social-media-design' => [
            'name' => 'Social Media Design Subscription',
            'description' => 'Monthly social media design subscription for consistent brand presence.',
            'packages' => [
                'starter' => [
                    'name' => 'Starter Pack',
                    'price' => 30000,
                    'description' => '5 social media designs per month and content support.',
                ],
                'standard' => [
                    'name' => 'Standard Pack',
                    'price' => 60000,
                    'description' => '10 monthly designs with faster turnaround and priority support.',
                ],
                'business' => [
                    'name' => 'Business Pack',
                    'price' => 90000,
                    'description' => '15 monthly designs, unlimited revisions, and account management.',
                ],
            ],
        ],
        'graphic-design' => [
            'name' => 'Graphic Design',
            'description' => 'Design support for campaign creatives, print work, and visual assets.',
            'packages' => [
                'basic' => [
                    'name' => 'Basic',
                    'price' => 45000,
                    'description' => 'Entry package for focused design requests.',
                ],
                'growth' => [
                    'name' => 'Growth',
                    'price' => 85000,
                    'description' => 'Balanced package for recurring campaign design work.',
                ],
                'premium' => [
                    'name' => 'Premium',
                    'price' => 150000,
                    'description' => 'High-output package with larger design bandwidth.',
                ],
            ],
        ],
        'brand-design' => [
            'name' => 'Brand Design',
            'description' => 'Logo systems and complete identity development for ambitious brands.',
            'packages' => [
                'logo-design' => [
                    'name' => 'Logo Design',
                    'price' => 70000,
                    'description' => 'Distinctive logo concepts and final identity lockups.',
                ],
                'brand-system' => [
                    'name' => 'Brand System Design',
                    'price' => 150000,
                    'description' => 'Typography, color, and layout system documentation.',
                ],
                'full-identity' => [
                    'name' => 'Full Brand Identity',
                    'price' => 280000,
                    'description' => 'Complete strategic and visual identity suite.',
                ],
            ],
        ],
        'web-design' => [
            'name' => 'Web Design (Full Stack)',
            'description' => 'Full-stack web products from UX and frontend to backend integrations.',
            'packages' => [
                'starter' => [
                    'name' => 'Starter',
                    'price' => 350000,
                    'description' => 'Core full-stack website for early-stage businesses.',
                ],
                'business' => [
                    'name' => 'Business',
                    'price' => 700000,
                    'description' => 'Expanded full-stack build with admin and integrations.',
                ],
                'enterprise' => [
                    'name' => 'Enterprise',
                    'price' => 1400000,
                    'description' => 'Advanced architecture and custom workflows for scale.',
                ],
            ],
        ],
        'mobile-app-development' => [
            'name' => 'Mobile App Development',
            'description' => 'Mobile app product development for launch and long-term scale.',
            'packages' => [
                'mvp' => [
                    'name' => 'MVP Build',
                    'price' => 900000,
                    'description' => 'Core MVP app build for validated launch.',
                ],
                'growth' => [
                    'name' => 'Growth Build',
                    'price' => 1800000,
                    'description' => 'Feature-rich app with stronger product infrastructure.',
                ],
                'scale' => [
                    'name' => 'Scale Build',
                    'price' => 3200000,
                    'description' => 'High-scale implementation for larger product operations.',
                ],
            ],
        ],
        'ui-ux' => [
            'name' => 'UI/UX Design',
            'description' => 'UX strategy, wireframes, and polished interface systems.',
            'packages' => [
                'sprint' => [
                    'name' => 'Design Sprint',
                    'price' => 250000,
                    'description' => 'Focused UX/UI sprint for one product flow.',
                ],
                'product' => [
                    'name' => 'Product Design',
                    'price' => 600000,
                    'description' => 'Comprehensive UI/UX package for multi-flow products.',
                ],
                'comprehensive' => [
                    'name' => 'Comprehensive UX System',
                    'price' => 1200000,
                    'description' => 'Deep UX research and full design system handoff.',
                ],
            ],
        ],
    ],
];
