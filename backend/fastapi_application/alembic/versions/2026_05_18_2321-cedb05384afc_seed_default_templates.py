"""seed_default_templates

Revision ID: cedb05384afc
Revises: f12ff860a986
Create Date: 2026-05-18 23:21:56.947059

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cedb05384afc"
down_revision: str | Sequence[str] | None = "f12ff860a986"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Seed default templates."""
    templates_table = sa.table(
        "templates",
        sa.column("id", sa.Integer),
        sa.column("title", sa.String(100)),
        sa.column("description", sa.Text),
        sa.column("category", sa.String(50)),
        sa.column("blocks", sa.JSON),
        sa.column("is_public", sa.Boolean),
    )

    op.bulk_insert(
        templates_table,
        [
            {
                "title": "SaaS Startup",
                "description": "Classic SaaS business plan with executive summary, problem, solution, and financial projections.",
                "category": "saas",
                "blocks": [
                    {
                        "title": "Executive Summary",
                        "content": "Brief overview of the SaaS product and vision.",
                        "block_type": "general",
                        "rich_content": {
                            "type": "doc",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {"type": "text", "text": "Brief overview of the SaaS product and vision."}
                                    ],
                                }
                            ],
                        },
                    },
                    {
                        "title": "Problem",
                        "content": "Describe the pain point your SaaS solves.",
                        "block_type": "general",
                    },
                    {
                        "title": "Solution",
                        "content": "Explain how your product addresses the problem.",
                        "block_type": "general",
                    },
                    {"title": "Market Opportunity", "content": "TAM, SAM, SOM analysis.", "block_type": "metrics"},
                    {
                        "title": "Business Model",
                        "content": "Pricing tiers, MRR targets, churn assumptions.",
                        "block_type": "financial",
                    },
                    {
                        "title": "Go-to-Market",
                        "content": "Marketing channels and sales strategy.",
                        "block_type": "marketing",
                    },
                    {"title": "SWOT Analysis", "content": "", "block_type": "swot"},
                    {"title": "Roadmap", "content": "", "block_type": "timeline"},
                    {"title": "Financial Projections", "content": "", "block_type": "chart_embed"},
                ],
                "is_public": True,
            },
            {
                "title": "Restaurant",
                "description": "Restaurant business plan covering concept, menu, location, and operations.",
                "category": "retail",
                "blocks": [
                    {
                        "title": "Concept & Vision",
                        "content": "What makes your restaurant unique.",
                        "block_type": "general",
                    },
                    {
                        "title": "Menu Overview",
                        "content": "Key dishes, pricing, and sourcing strategy.",
                        "block_type": "general",
                    },
                    {
                        "title": "Location Analysis",
                        "content": "Foot traffic, rent, and demographics.",
                        "block_type": "general",
                    },
                    {
                        "title": "Operations Plan",
                        "content": "Staffing, hours, suppliers, and equipment.",
                        "block_type": "operations",
                    },
                    {
                        "title": "Marketing Strategy",
                        "content": "Social media, local partnerships, and promotions.",
                        "block_type": "marketing",
                    },
                    {
                        "title": "Financial Plan",
                        "content": "Startup costs, break-even, and P&L.",
                        "block_type": "financial",
                    },
                    {"title": "SWOT Analysis", "content": "", "block_type": "swot"},
                ],
                "is_public": True,
            },
            {
                "title": "E-commerce Store",
                "description": "Online retail business plan with product strategy, logistics, and digital marketing.",
                "category": "retail",
                "blocks": [
                    {
                        "title": "Store Overview",
                        "content": "Niche, brand positioning, and target audience.",
                        "block_type": "general",
                    },
                    {
                        "title": "Product Strategy",
                        "content": "Catalog, sourcing, and inventory plan.",
                        "block_type": "general",
                    },
                    {
                        "title": "Marketing Funnel",
                        "content": "Ads, SEO, email, and retention.",
                        "block_type": "marketing",
                    },
                    {
                        "title": "Operations & Logistics",
                        "content": "Shipping, returns, and customer service.",
                        "block_type": "operations",
                    },
                    {"title": "Key Metrics", "content": "", "block_type": "metrics"},
                    {"title": "Financial Projections", "content": "", "block_type": "financial"},
                ],
                "is_public": True,
            },
            {
                "title": "Freelance Agency",
                "description": "Service business plan for a freelance or consulting agency.",
                "category": "service",
                "blocks": [
                    {
                        "title": "Agency Overview",
                        "content": "Services offered and value proposition.",
                        "block_type": "general",
                    },
                    {
                        "title": "Target Clients",
                        "content": "Ideal client profile and industries.",
                        "block_type": "general",
                    },
                    {
                        "title": "Pricing & Packages",
                        "content": "Hourly rates, retainers, and project fees.",
                        "block_type": "financial",
                    },
                    {
                        "title": "Sales Process",
                        "content": "Lead generation, proposals, and closing.",
                        "block_type": "marketing",
                    },
                    {
                        "title": "Team Structure",
                        "content": "Core team, contractors, and hiring plan.",
                        "block_type": "operations",
                    },
                    {"title": "Goals & Milestones", "content": "", "block_type": "timeline"},
                ],
                "is_public": True,
            },
            {
                "title": "Mobile App",
                "description": "Mobile app startup plan with UX, monetization, and growth strategy.",
                "category": "saas",
                "blocks": [
                    {
                        "title": "App Concept",
                        "content": "Core functionality and user stories.",
                        "block_type": "general",
                    },
                    {
                        "title": "User Personas",
                        "content": "Primary and secondary target users.",
                        "block_type": "general",
                    },
                    {
                        "title": "Monetization",
                        "content": "Freemium, ads, subscriptions, or one-time.",
                        "block_type": "financial",
                    },
                    {
                        "title": "Growth Strategy",
                        "content": "ASO, viral loops, and paid acquisition.",
                        "block_type": "marketing",
                    },
                    {
                        "title": "Tech Stack",
                        "content": "Platform, backend, and third-party services.",
                        "block_type": "operations",
                    },
                    {"title": "KPIs", "content": "", "block_type": "metrics"},
                    {"title": "Launch Roadmap", "content": "", "block_type": "timeline"},
                ],
                "is_public": True,
            },
        ],
    )


def downgrade() -> None:
    """Remove seeded templates."""
    op.execute("DELETE FROM templates WHERE category IN ('saas', 'retail', 'service')")
