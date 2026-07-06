# PII Anonymization Evaluation Report

**Generator:** Nikan AI · Anonymization Evaluation Framework  
**Date:** 2026-06-30  
**Dataset:** 7 runs · 60 documents · 475 PII entities · 9 document types · 9.4 min wall-clock (concurrent)

---

## 01 · Executive Summary

| Metric | Value | Basis |
|---|---|---|
| **Overall PII Recall** | **93.3%** | 443 / 475 entities |
| **High-Criticality PII Recall** | **99.6%** | name · email · phone · SSN · passport · national ID · address · DOB · credit card · IBAN |
| **Low-Criticality PII Recall** | **83.8%** | city · company · date · zip · age |
| **False-Positive Preservation** | **25.9%** | 215 safe phrases over-anonymized out of 290 tested |
| **Round-Trip Recall** | **97.3%** | De-anonymization fidelity across all docs |

> Round-trip recall is strong at 97.3%. De-anonymization is successfully restoring original entity values in the output.

---

## 02 · Run Comparison

7 configurations · 60 total document passes

| Configuration | Docs | Overall Recall | High-PII | Low-PII | FP Preservation | Round-trip | Time |
|---|---|---|---|---|---|---|---|
| European & International | 10 | 96.3% | 100.0% | 72.0% | 20.0% | 86.8% | 9.1m |
| Financial Crime & Legal | 10 | 100.0% | 100.0% | 100.0% | 44.4% | 100.0% | 8.7m |
| Healthcare & Insurance | 10 | 98.1% | 97.8% | 100.0% | 12.0% | 99.4% | 8.3m |
| Career & Employment | 10 | 87.6% | 100.0% | 55.8% | 26.0% | 99.5% | 9.4m |
| Customer Support | 10 | 100.0% | 100.0% | 100.0% | 2.0% | 96.7% | 8.3m |
| Rental & Housing | 5 | 100.0% | 100.0% | 100.0% | 52.0% | 100.0% | 5.1m |
| Clinical Patient Intake | 5 | 99.0% | 100.0% | 95.0% | 52.0% | 100.0% | 5.8m |

---

## 03 · By Document Type

11 document categories · averages across all runs

| Document Type | Avg Anon Recall | Avg Round-trip | Avg FP Preservation | Sample Count | Avg Time/Doc |
|---|---|---|---|---|---|
| banking fraud report | 100.0% | 100.0% | 40.0% | 5 | 1.1m |
| customer support ticket | 100.0% | 96.7% | 2.0% | 10 | 50s |
| legal deposition | 100.0% | 100.0% | 48.0% | 5 | 41s |
| medical referral | 100.0% | 98.7% | 12.0% | 5 | 52s |
| rental agreement | 100.0% | 100.0% | 52.0% | 5 | 1.0m |
| patient intake | 99.0% | 100.0% | 52.0% | 5 | 1.2m |
| passport application | 98.4% | 80.0% | 32.0% | 5 | 44s |
| insurance claim | 96.6% | 100.0% | 12.0% | 5 | 48s |
| b2b inquiry | 92.3% | 100.0% | 5.0% | 5 | 1.1m |
| hr onboarding | 88.7% | 100.0% | 20.0% | 5 | 44s |
| job application | 85.7% | 98.6% | 32.0% | 5 | 1.2m |

---

## 04 · By Entity Type

PII recall per entity category · all runs pooled

| Entity Type | Tier | Recall | Hits / Attempts |
|---|---|---|---|
| city | LOW | 100.0% | 60 / 60 |
| email | HIGH | 100.0% | 60 / 60 |
| phone\_number | HIGH | 100.0% | 60 / 60 |
| passport | HIGH | 100.0% | 5 / 5 |
| national\_id | HIGH | 100.0% | 10 / 10 |
| date\_of\_birth | HIGH | 100.0% | 34 / 34 |
| address | HIGH | 100.0% | 35 / 35 |
| credit\_card | HIGH | 100.0% | 5 / 5 |
| bank\_account | HIGH | 100.0% | 5 / 5 |
| ssn | HIGH | 100.0% | 10 / 10 |
| state | LOW | 100.0% | 46 / 46 |
| name | HIGH | 98.3% | 59 / 60 |
| zip\_code | LOW | 97.1% | 34 / 35 |
| date | LOW | 80.0% | 4 / 5 |
| age | LOW | 80.0% | 4 / 5 |
| country | LOW | 73.3% | 11 / 15 |
| company\_name | LOW | 6.7% | 1 / 15 |
| job\_title | LOW | 0.0% | 0 / 10 |

---

## 05 · Missed Entities

32 total misses · top entity types: `company_name` (14), `job_title` (10), `country` (4), `name` (1), `zip_code` (1), `date` (1), `age` (1)

> **Over-anonymization:** 215 safe phrases incorrectly pseudonymised out of 290 tested. These are non-PII domain phrases (e.g. "unauthorized transactions", "referral letter") that were wrongly included in the substitution.

| Tier | Entity Type | Value | Document Type | Document |
|---|---|---|---|---|
| HIGH | `name` | "Fatima El-Amin" | insurance claim | insurance\_claim\_02 |
| LOW | `company_name` | "Nexus Digital GmbH" | b2b inquiry | b2b\_inquiry\_01 |
| LOW | `company_name` | "ClearPath Solutions" | b2b inquiry | b2b\_inquiry\_03 |
| LOW | `company_name` | "DataSphere AG" | b2b inquiry | b2b\_inquiry\_04 |
| LOW | `country` | "Switzerland" | b2b inquiry | b2b\_inquiry\_04 |
| LOW | `company_name` | "Meridian Tech SL" | b2b inquiry | b2b\_inquiry\_05 |
| LOW | `job_title` | "Software Engineer" | hr onboarding | hr\_onboarding\_01 |
| LOW | `company_name` | "Vertex Cloud Inc" | hr onboarding | hr\_onboarding\_01 |
| LOW | `job_title` | "Data Engineer" | hr onboarding | hr\_onboarding\_02 |
| LOW | `company_name` | "PipelineX Ltd" | hr onboarding | hr\_onboarding\_02 |
| LOW | `job_title` | "Business Analyst" | hr onboarding | hr\_onboarding\_03 |
| LOW | `company_name` | "Global Meridian SA" | hr onboarding | hr\_onboarding\_03 |
| LOW | `country` | "Romania" | hr onboarding | hr\_onboarding\_03 |
| LOW | `zip_code` | "030167" | hr onboarding | hr\_onboarding\_03 |
| LOW | `job_title` | "Product Manager" | hr onboarding | hr\_onboarding\_04 |
| LOW | `company_name` | "FuturePath Inc" | hr onboarding | hr\_onboarding\_04 |
| LOW | `date` | "October 1, 2024" | hr onboarding | hr\_onboarding\_04 |
| LOW | `job_title` | "Frontend Developer" | hr onboarding | hr\_onboarding\_05 |
| LOW | `company_name` | "Pixel Labs LLC" | hr onboarding | hr\_onboarding\_05 |
| LOW | `job_title` | "Data Scientist" | job application | job\_application\_01 |
| LOW | `company_name` | "Luminary Analytics" | job application | job\_application\_01 |
| LOW | `job_title` | "Product Manager" | job application | job\_application\_02 |
| LOW | `company_name` | "Horizon Systems" | job application | job\_application\_02 |
| LOW | `job_title` | "UX Designer" | job application | job\_application\_03 |
| LOW | `company_name` | "CreativeWave Inc" | job application | job\_application\_03 |
| LOW | `job_title` | "DevOps Engineer" | job application | job\_application\_04 |
| LOW | `company_name` | "CloudNest Technologies" | job application | job\_application\_04 |
| LOW | `job_title` | "Marketing Manager" | job application | job\_application\_05 |
| LOW | `company_name` | "BrightMark Agency" | job application | job\_application\_05 |
| LOW | `country` | "United Kingdom" | passport application | passport\_application\_04 |
| LOW | `country` | "Senegal" | passport application | passport\_application\_05 |
| LOW | `age` | "45" | patient intake | patient\_intake\_02 |

---

## 06 · Per-Run Document Detail

### European & International

10 documents · 9.1 min  
B2B business inquiries from European companies + passport/visa applications. Tested entity types: name, email, company, city, country, phone, passport, national\_id, address, date\_of\_birth.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| b2b inquiry 01 | 92.3% | 0.0% | 100.0% | 60s | [LOW] `company_name`: "Nexus Digital GmbH" |
| b2b inquiry 02 | 100.0% | 0.0% | 100.0% | 58s | — |
| b2b inquiry 03 | 92.3% | 0.0% | 100.0% | 1.4m | [LOW] `company_name`: "ClearPath Solutions" |
| b2b inquiry 04 | 84.6% | 0.0% | 100.0% | 1.0m | [LOW] `company_name`: "DataSphere AG"; [LOW] `country`: "Switzerland" |
| b2b inquiry 05 | 92.3% | 25.0% | 100.0% | 1.0m | [LOW] `company_name`: "Meridian Tech SL" |
| passport application 01 | 100.0% | 40.0% | 0.0% | 59s | — |
| passport application 02 | 100.0% | 20.0% | 100.0% | 33s | — |
| passport application 03 | 100.0% | 60.0% | 100.0% | 44s | — |
| passport application 04 | 96.1% | 20.0% | 100.0% | 46s | [LOW] `country`: "United Kingdom" |
| passport application 05 | 96.1% | 20.0% | 100.0% | 41s | [LOW] `country`: "Senegal" |

---

### Financial Crime & Legal

10 documents · 8.7 min  
Banking fraud alert letters + legal deposition preambles. Highest-density sensitive PII: SSN, bank\_account, credit\_card, address, phone, email, name, date\_of\_birth.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| banking fraud report 01 | 100.0% | 25.0% | 100.0% | 1.0m | — |
| banking fraud report 02 | 100.0% | 25.0% | 100.0% | 1.4m | — |
| banking fraud report 03 | 100.0% | 50.0% | 100.0% | 1.0m | — |
| banking fraud report 04 | 100.0% | 50.0% | 100.0% | 52s | — |
| banking fraud report 05 | 100.0% | 50.0% | 100.0% | 56s | — |
| legal deposition 01 | 100.0% | 40.0% | 100.0% | 1.1m | — |
| legal deposition 02 | 100.0% | 20.0% | 100.0% | 33s | — |
| legal deposition 03 | 100.0% | 60.0% | 100.0% | 28s | — |
| legal deposition 04 | 100.0% | 60.0% | 100.0% | 59s | — |
| legal deposition 05 | 100.0% | 60.0% | 100.0% | 24s | — |

---

### Healthcare & Insurance

10 documents · 8.3 min  
Medical referral letters + property insurance claim reports. Entity mix: name, date\_of\_birth, phone, email, city, state, address, zip\_code.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| medical referral 01 | 100.0% | 20.0% | 100.0% | 56s | — |
| medical referral 02 | 100.0% | 20.0% | 93.5% | 57s | — |
| medical referral 03 | 100.0% | 0.0% | 100.0% | 38s | — |
| medical referral 04 | 100.0% | 20.0% | 100.0% | 57s | — |
| medical referral 05 | 100.0% | 0.0% | 100.0% | 48s | — |
| insurance claim 01 | 100.0% | 0.0% | 100.0% | 46s | — |
| insurance claim 02 | 83.1% | 0.0% | 100.0% | 40s | **[HIGH]** `name`: "Fatima El-Amin" |
| insurance claim 03 | 100.0% | 0.0% | 100.0% | 39s | — |
| insurance claim 04 | 100.0% | 20.0% | 100.0% | 55s | — |
| insurance claim 05 | 100.0% | 40.0% | 100.0% | 58s | — |

---

### Career & Employment

10 documents · 9.4 min  
Job application cover letters + HR onboarding acceptance letters. Entity mix: name, job\_title, email, phone, date\_of\_birth, address, city, state, country, date.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| job application 01 | 85.7% | 20.0% | 92.9% | 1.8m | [LOW] `job_title`: "Data Scientist"; [LOW] `company_name`: "Luminary Analytics" |
| job application 02 | 85.7% | 40.0% | 100.0% | 46s | [LOW] `job_title`: "Product Manager"; [LOW] `company_name`: "Horizon Systems" |
| job application 03 | 85.7% | 20.0% | 100.0% | 1.6m | [LOW] `job_title`: "UX Designer"; [LOW] `company_name`: "CreativeWave Inc" |
| job application 04 | 85.7% | 60.0% | 100.0% | 52s | [LOW] `job_title`: "DevOps Engineer"; [LOW] `company_name`: "CloudNest Technologies" |
| job application 05 | 85.7% | 20.0% | 100.0% | 48s | [LOW] `job_title`: "Marketing Manager"; [LOW] `company_name`: "BrightMark Agency" |
| hr onboarding 01 | 91.5% | 20.0% | 100.0% | 1.1m | [LOW] `job_title`: "Software Engineer"; [LOW] `company_name`: "Vertex Cloud Inc" |
| hr onboarding 02 | 91.2% | 20.0% | 100.0% | 46s | [LOW] `job_title`: "Data Engineer"; [LOW] `company_name`: "PipelineX Ltd" |
| hr onboarding 03 | 82.4% | 20.0% | 100.0% | 51s | [LOW] `job_title`: "Business Analyst"; [LOW] `company_name`: "Global Meridian SA"; [LOW] `country`: "Romania"; [LOW] `zip_code`: "030167" |
| hr onboarding 04 | 86.8% | 20.0% | 100.0% | 32s | [LOW] `job_title`: "Product Manager"; [LOW] `company_name`: "FuturePath Inc"; [LOW] `date`: "October 1, 2024" |
| hr onboarding 05 | 91.5% | 20.0% | 100.0% | 23s | [LOW] `job_title`: "Frontend Developer"; [LOW] `company_name`: "Pixel Labs LLC" |

---

### Customer Support

10 documents · 8.3 min  
Customer support tickets reporting outages, billing disputes, or service issues. Entity mix: name, phone\_number, email, city, state, zip\_code.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| customer support ticket 01 | 100.0% | 0.0% | 66.7% | 56s | — |
| customer support ticket 02 | 100.0% | 0.0% | 100.0% | 55s | — |
| customer support ticket 03 | 100.0% | 0.0% | 100.0% | 38s | — |
| customer support ticket 04 | 100.0% | 0.0% | 100.0% | 1.0m | — |
| customer support ticket 05 | 100.0% | 0.0% | 100.0% | 1.4m | — |
| customer support ticket 06 | 100.0% | 0.0% | 100.0% | 52s | — |
| customer support ticket 07 | 100.0% | 20.0% | 100.0% | 38s | — |
| customer support ticket 08 | 100.0% | 0.0% | 100.0% | 54s | — |
| customer support ticket 09 | 100.0% | 0.0% | 100.0% | 24s | — |
| customer support ticket 10 | 100.0% | 0.0% | 100.0% | 38s | — |

---

### Rental & Housing

5 documents · 5.1 min  
Tenant rental application inquiries to property managers. Entity mix: name, address, city, state, zip\_code, date\_of\_birth, national\_id, email, phone\_number.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| rental agreement 01 | 100.0% | 60.0% | 100.0% | 60s | — |
| rental agreement 02 | 100.0% | 40.0% | 100.0% | 1.4m | — |
| rental agreement 03 | 100.0% | 80.0% | 100.0% | 1.0m | — |
| rental agreement 04 | 100.0% | 20.0% | 100.0% | 48s | — |
| rental agreement 05 | 100.0% | 60.0% | 100.0% | 49s | — |

---

### Clinical Patient Intake

5 documents · 5.8 min  
New patient intake registration messages for clinics and doctor's offices. Entity mix: name, date\_of\_birth, age, address, city, state, zip\_code, email, phone\_number.

| Document | Anon Recall | FP Preservation | Round-trip | Time | Missed Entities |
|---|---|---|---|---|---|
| patient intake 01 | 100.0% | 40.0% | 100.0% | 58s | — |
| patient intake 02 | 95.2% | 40.0% | 100.0% | 57s | [LOW] `age`: "45" |
| patient intake 03 | 100.0% | 60.0% | 100.0% | 1.8m | — |
| patient intake 04 | 100.0% | 60.0% | 100.0% | 1.3m | — |
| patient intake 05 | 100.0% | 60.0% | 100.0% | 48s | — |

---

## Methodology Note

This evaluation used labeled synthetic documents. Each document was generated with a fixed ground-truth set of PII entities per document type. **Recall** measures whether each labeled entity was absent from the anonymised output (i.e., successfully pseudonymised). **Round-trip recall** measures whether deanonymising the output restored all originally pseudonymised entities to their exact original values. **FP preservation** measures what fraction of designated "safe" control phrases were correctly left unchanged — a low FP preservation score means the model over-anonymised.

Entity tier definitions:

- **HIGH** — entities directly and uniquely identifying a natural person (name, contact details, financial identifiers, government IDs, biometrics)
- **LOW** — contextual or quasi-identifying entities that may contribute to re-identification in combination (location fields, dates, company affiliations, job roles)

All misses in this evaluation were LOW-tier entities except one HIGH-tier miss (`name`: "Fatima El-Amin" in `insurance_claim_02`).
