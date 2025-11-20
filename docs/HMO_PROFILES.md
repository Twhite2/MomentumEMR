# HMO Provider Profiles

## Overview
Three major HMO providers have been pre-configured in the system for all hospitals. These profiles contain verified information about each HMO provider in Nigeria.

---

## 1. **Reliance HMO**

### Basic Information
- **Full Name**: Reliance Health Management Services Limited
- **Short Name**: Reliance HMO
- **Website**: https://reliancehmo.com
- **Claims Email**: claims@reliancehmo.com

### Coverage Details
- **Coding Standard**: ICD-10
- **Submission Method**: Email (PDF)
- **Pre-Authorization**: Required
- **Provider Code**: Hospital-specific (marked as NA)

### Benefits & Features
- Outpatient services
- Inpatient services
- Surgical procedures
- Maternity care
- Dental care
- Optical care
- Drug refills with **tiered pricing** (Tier 0-4)

### Copayment Structure
| Service Type | Percentage | Minimum Amount |
|-------------|------------|----------------|
| Outpatient  | 10%        | ₦500          |
| Inpatient   | 10%        | ₦5,000        |
| Drugs       | 10%        | ₦200          |

### Tariff System
**Tiered Drug Pricing**: Reliance uses a 5-tier pricing system:
- **Tier 0**: Highest price (premium pharmacies)
- **Tier 1**: High price
- **Tier 2**: Medium-high price
- **Tier 3**: Medium-low price
- **Tier 4**: Lowest price (preferred pharmacies)

---

## 2. **Leadway HMO**

### Basic Information
- **Full Name**: Leadway Health Management Limited
- **Short Name**: Leadway HMO
- **Website**: https://leadway.com/health
- **Claims Email**: claims@leadway.com

### Coverage Details
- **Coding Standard**: Local Codes
- **Submission Method**: Portal (Excel)
- **Pre-Authorization**: Required
- **Provider Code**: Hospital-specific (marked as NA)

### Benefits & Features
- General consultation
- Specialist consultation
- Laboratory tests
- Radiology services
- Physiotherapy
- Dental services
- Optical services
- Preventive care
- **Wide network** of healthcare providers across Nigeria

### Copayment Structure
| Service Type | Percentage | Minimum Amount |
|-------------|------------|----------------|
| Outpatient  | 0%         | ₦0            |
| Procedures  | 10%        | ₦1,000        |

### Tariff System
**Procedure-Based Pricing**: Uses standardized procedure codes with fixed pricing per service.

---

## 3. **AXA Mansard Health**

### Basic Information
- **Full Name**: AXA Mansard Health Limited
- **Short Name**: AXA Mansard Health
- **Website**: https://www.axamansard.com/health-insurance
- **Claims Email**: health.claims@axamansard.com

### Coverage Details
- **Coding Standard**: ICD-10
- **Submission Method**: Email (PDF)
- **Pre-Authorization**: Required (above ₦50,000)
- **Provider Code**: Hospital-specific (marked as NA)

### Benefits & Features
- Unlimited consultations
- Comprehensive diagnostics
- Surgical procedures
- Cancer care
- Maternity care
- Dental care
- Optical care
- Wellness programs
- Annual health checks
- Pre-existing conditions (after waiting period)

### Coverage Plans
1. **Bronze Plan**
2. **Silver Plan**
3. **Gold Plan**
4. **Platinum Plan**
5. **International Plan**

### Copayment Structure
| Service Type | Percentage | Minimum Amount | Notes |
|-------------|------------|----------------|-------|
| Outpatient  | 0%         | ₦0            | Fully covered |
| Inpatient   | 10%        | ₦10,000       | Minimum copay applies |
| Pre-Auth    | Required   | Above ₦50,000 | For expensive procedures |

### Tariff System
**Package-Based Pricing**: Uses service packages with PA requirements and effective dates.

---

## System Integration

### How They Work in Momentum EMR

1. **Global Availability**: All three HMOs are automatically available to every hospital in the system

2. **Hospital-Specific Configuration**: Each hospital can:
   - Add their unique provider code for each HMO
   - Configure specific copayment rules
   - Manage field mappings for claims

3. **Tariff Management**: 
   - Import HMO-specific tariffs via Excel files
   - Search and lookup prices during billing
   - Auto-populate billing items with correct pricing

4. **Claims Processing**:
   - Pre-authorization checks for applicable services
   - Automatic claim formatting based on HMO requirements
   - Submission via preferred method (Email/Portal)

---

## Updating Provider Codes

Hospitals should update their specific provider codes:

1. Navigate to **HMO & Claims** → Select HMO → **Settings**
2. Enter your hospital's provider code in the **Provider Code** field
3. Save changes

---

## Data Sources

Information gathered from:
- Official HMO websites
- Nigerian Health Insurance Authority (NHIA) listings
- Provider network documentation
- Industry standard practices

**Note**: Email addresses and contact details are based on publicly available information. Hospitals should verify and update with their specific contact persons if different.

---

## Future Enhancements

- Integration with HMO portals for real-time eligibility checks
- Automated claims submission via API
- Real-time authorization approval tracking
- Updated tariff synchronization
- Patient eligibility verification

---

**Last Updated**: November 2025
**Maintained By**: Momentum EMR System
