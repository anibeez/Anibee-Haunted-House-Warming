Housewarming Funds Website

Architecture & Implementation Guide

1. Purpose & Scope

This project is a lightweight, personal housewarming funds website that:

Displays multiple funding goals (e.g., stairs, lawn mower)

Shows live progress toward each goal

Redirects contributors to Venmo for payment

Tracks pledged amounts internally

Avoids wedding registries, charity framing, or third-party platforms

Out of scope

Processing payments directly

Automatic Venmo payment confirmation

User accounts or authentication for guests

2. High-Level User Flow
Guest Flow

Guest opens invitation link → website

Guest sees list of house projects with goals + progress bars

Guest selects a project

Guest enters amount (optional name/message)

Site records a pledge

Guest is redirected to Venmo with:

amount prefilled

note identifying the project

Admin Flow

Admin views totals per fund

Admin optionally reconciles Venmo payments

Admin can manually adjust totals if needed

3. System Architecture Overview

Architecture style: Serverless, static-first
Hosting: AWS
Cost target: Near-zero idle cost, pennies at low traffic

Browser
  │
  │ HTTPS
  ▼
CloudFront
  │
  ▼
S3 (Static Site)
  │
  │ API calls
  ▼
API Gateway
  │
  ▼
Lambda Functions
  │
  ▼
DynamoDB

4. Core AWS Components
4.1 Amazon S3 (Static Site Hosting)

Stores:

index.html

styles.css

app.js

Responsibilities:

Serve the UI

No server-side rendering

No secrets stored here

4.2 CloudFront

HTTPS

CDN caching

Optional custom domain

Protects S3 from direct public access

4.3 API Gateway

Provides minimal REST API:

GET /funds

POST /pledge

(optional) POST /admin/adjust

4.4 AWS Lambda

Stateless functions that:

Fetch fund data

Record pledges

Generate Venmo redirect URLs

4.5 DynamoDB

Single table to track:

Fund definitions

Fund totals

Individual pledges (optional but recommended)

5. Data Model
DynamoDB Table: HousewarmingFunds

Partition Key: PK
Sort Key: SK

Fund Records
PK = FUND
SK = <fund_id>

Attributes:
- fund_id (string)
- name (string)
- description (string)
- goal_amount (number)
- current_amount (number)
- created_at (ISO timestamp)

Pledge Records
PK = FUND#<fund_id>
SK = PLEDGE#<timestamp>#<uuid>

Attributes:
- pledge_amount (number)
- contributor_name (string, optional)
- message (string, optional)
- venmo_note (string)
- created_at (ISO timestamp)


This design allows:

Fast fund lookup

Easy aggregation

Optional audit trail

6. API Design
6.1 GET /funds

Returns all funds and current totals.

Response

[
  {
    "fund_id": "stairs",
    "name": "Back Steps",
    "goal": 1500,
    "current": 825
  },
  {
    "fund_id": "mower",
    "name": "Lawn Mower",
    "goal": 700,
    "current": 300
  }
]

6.2 POST /pledge

Records a pledge and returns a Venmo redirect URL.

Request

{
  "fund_id": "stairs",
  "amount": 50,
  "name": "Alex",
  "message": "Congrats!"
}


Response

{
  "redirect_url": "https://venmo.com/USERNAME?txn=pay&amount=50&note=Housewarming%20STAIRS"
}


Behavior

Increment current_amount

Create pledge record

Generate Venmo deep link

6.3 (Optional) POST /admin/adjust

Allows manual correction after reconciliation.

Protected via:

Secret token header

OR obscure admin URL

7. Venmo Integration Strategy
7.1 Venmo Deep Linking

Venmo does not support server-side payment confirmation for personal accounts.

Use redirect links:

https://venmo.com/<username>?txn=pay&amount=<AMOUNT>&note=<NOTE>


Note format (important):

Housewarming - STAIRS
Housewarming - MOWER


This allows:

Manual reconciliation

Human-readable intent

Easy matching

8. Tracking Strategy (Important Design Decision)
What Is Tracked Automatically

✅ Pledges
✅ Intended fund
✅ Amounts

What Is Not Automatically Verified

❌ Actual Venmo payment completion

Mitigation

Pledge totals drive progress bars

Venmo notes identify fund

Admin can adjust totals post-event if needed

This is appropriate and acceptable for a personal housewarming site.

9. Frontend Structure
9.1 UI Components

Header (explanation text)

Fund cards:

Name

Goal

Progress bar

“Contribute” button

Modal / inline form:

Amount input

Optional name/message

9.2 JavaScript Responsibilities

Fetch fund data

Render progress bars

Handle pledge submission

Redirect to Venmo

10. Security Considerations

No PII required

No payment processing

No authentication for guests

Admin endpoints protected by:

Environment variable token

OR IP restriction

HTTPS enforced via CloudFront

11. Cost Expectations (Typical)
Service	Cost
S3	~$0
CloudFront	~$0
Lambda	~$0
DynamoDB	~$0
API Gateway	~$0

For a single housewarming event, this will almost certainly stay in the free tier or cost a few cents.

12. Deployment Strategy

Create S3 bucket (private)

Upload static site

Create CloudFront distribution

Create DynamoDB table

Deploy Lambda functions

Wire API Gateway

Set environment variables:

VENMO_USERNAME

ADMIN_TOKEN

Update frontend API base URL

Share CloudFront URL on invitations

13. Future Enhancements (Optional)

Admin dashboard UI

Fund images/icons

Deadline countdown

CSV export of pledges

Stripe/PayPal fallback (if Venmo ever becomes limiting)

14. Guiding Principles

Transparency over automation

Low friction over perfection

Personal gifting, not fundraising

Simple enough to explain on an invite

If you want next steps, I can:

generate the DynamoDB schema as IaC

write the Lambda handler skeletons

design the HTML/CSS fund card layout

or help you simplify this further if you decide AWS is overkill

This is a really solid idea, by the way — practical, modern, and very you.