# Backend Structure - Assessment Database Model

## Overview
The Assessment model represents business assessments conducted through the AI questionnaire system. It stores user responses, processing status, and generated recommendations for website development.

## Schema Definition

### MongoDB Schema
```javascript
const assessmentSchema = new mongoose.Schema({
  // Session Information
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true,
    index: true
  },

  // Assessment Status
  status: {
    type: String,
    enum: ['in_progress', 'processing', 'completed', 'failed'],
    default: 'in_progress'
  },

  // Source Tracking
  source: {
    type: String,
    enum: ['homepage', 'email', 'social', 'referral', 'direct'],
    default: 'direct'
  },

  referrer: {
    type: String,
    trim: true
  },

  // Questionnaire Responses
  responses: {
    // Step 1: Business Information
    businessType: {
      type: String,
      enum: ['ecommerce', 'service', 'restaurant', 'healthcare', 'real_estate', 'education', 'nonprofit', 'other'],
      required: function() { return this.status !== 'in_progress'; }
    },

    businessTypeOther: {
      type: String,
      trim: true,
      maxlength: [100, 'Business type description cannot exceed 100 characters']
    },

    // Step 2: Business Details
    companyName: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },

    industry: {
      type: String,
      trim: true,
      maxlength: [50, 'Industry cannot exceed 50 characters']
    },

    employeeCount: {
      type: String,
      enum: ['1-5', '6-20', '21-50', '51-100', '100+']
    },

    // Step 3: Website Goals
    goals: [{
      type: String,
      enum: ['lead_generation', 'ecommerce', 'branding', 'information', 'booking', 'community', 'other']
    }],

    targetAudience: {
      type: String,
      trim: true,
      maxlength: [200, 'Target audience description cannot exceed 200 characters']
    },

    // Step 4: Current Situation
    hasWebsite: {
      type: Boolean,
      default: false
    },

    currentWebsiteUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+$/, 'Please enter a valid URL']
    },

    currentWebsiteIssues: [{
      type: String,
      enum: ['outdated_design', 'slow_loading', 'mobile_unfriendly', 'hard_to_update', 'no_leads', 'other']
    }],

    // Step 5: Design Preferences
    preferredStyle: {
      type: String,
      enum: ['modern', 'professional', 'creative', 'minimal', 'bold']
    },

    colorPreferences: {
      type: String,
      trim: true,
      maxlength: [100, 'Color preferences cannot exceed 100 characters']
    },

    brandGuidelines: {
      type: String,
      trim: true,
      maxlength: [500, 'Brand guidelines cannot exceed 500 characters']
    },

    // Step 6: Technical Requirements
    requiredFeatures: [{
      type: String,
      enum: ['contact_form', 'blog', 'ecommerce', 'booking_system', 'social_integration', 'seo', 'analytics', 'multilingual', 'other']
    }],

    integrations: [{
      type: String,
      enum: ['google_analytics', 'facebook_pixel', 'mailchimp', 'stripe', 'paypal', 'zapier', 'other']
    }],

    // Step 7: Budget & Timeline
    budget: {
      type: String,
      enum: ['under_1000', '1000_3000', '3000_5000', '5000_10000', 'over_10000']
    },

    timeline: {
      type: String,
      enum: ['asap', '1_month', '2_3_months', '3_6_months', 'flexible']
    },

    // Step 8: Contact Information (for lead conversion)
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    }
  },

  // AI Processing Results
  results: {
    recommendedPackage: {
      type: String,
      enum: ['ai_launch', 'pro_development', 'enterprise']
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100
    },

    recommendedFeatures: [{
      type: String
    }],

    pricing: {
      package: { type: String },
      basePrice: { type: Number },
      estimatedTotal: { type: Number },
      currency: { type: String, default: 'USD' }
    },

    timeline: {
      type: String,
      enum: ['1_week', '2_weeks', '1_month', '2_months', '3_months']
    },

    mockupUrl: {
      type: String,
      trim: true
    },

    customizations: [{
      type: String
    }],

    aiInsights: {
      type: String,
      trim: true
    }
  },

  // Processing Metadata
  processingStartedAt: {
    type: Date
  },

  processingCompletedAt: {
    type: Date
  },

  processingError: {
    type: String,
    trim: true
  },

  // Lead Conversion
  convertedToLead: {
    type: Boolean,
    default: false
  },

  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    },
    index: true
  }
}, {
  timestamps: true
});

// Indexes
assessmentSchema.index({ status: 1, createdAt: -1 });
assessmentSchema.index({ 'responses.email': 1 });
assessmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware
assessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for completion percentage
assessmentSchema.virtual('completionPercentage').get(function() {
  const requiredSteps = 8;
  let completedSteps = 0;

  if (this.responses.businessType) completedSteps++;
  if (this.responses.goals && this.responses.goals.length > 0) completedSteps++;
  if (this.responses.hasWebsite !== undefined) completedSteps++;
  if (this.responses.preferredStyle) completedSteps++;
  if (this.responses.requiredFeatures && this.responses.requiredFeatures.length > 0) completedSteps++;
  if (this.responses.budget) completedSteps++;
  if (this.responses.timeline) completedSteps++;
  if (this.responses.name && this.responses.email) completedSteps++;

  return Math.round((completedSteps / requiredSteps) * 100);
});

// Method to check if assessment is expired
assessmentSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to get processing duration
assessmentSchema.methods.getProcessingDuration = function() {
  if (!this.processingStartedAt || !this.processingCompletedAt) return null;
  return this.processingCompletedAt - this.processingStartedAt;
};

module.exports = mongoose.model('Assessment', assessmentSchema);
```

## Key Features

### Data Validation
- Comprehensive validation for all response fields
- Email format validation
- URL validation for existing websites
- Length limits on text fields

### Status Tracking
- In-progress assessments can be resumed
- Processing status for AI analysis
- Completed assessments with results
- Failed assessments with error tracking

### Expiration Handling
- Automatic expiration after 30 days
- Database-level TTL index for cleanup

### Lead Conversion
- Seamless transition from assessment to lead
- Reference to Lead model for CRM integration

### Analytics Support
- Source tracking for marketing attribution
- Completion percentage calculation
- Processing time metrics

## Usage Examples

### Creating New Assessment
```javascript
const assessment = new Assessment({
  sessionId: 'sess_123456',
  source: 'homepage'
});
```

### Updating Responses
```javascript
assessment.responses.businessType = 'ecommerce';
assessment.responses.goals = ['lead_generation', 'ecommerce'];
await assessment.save();
```

### Processing Results
```javascript
assessment.status = 'processing';
assessment.processingStartedAt = new Date();
// ... AI processing ...
assessment.status = 'completed';
assessment.results = {
  recommendedPackage: 'pro_development',
  confidence: 95,
  // ... other results
};
assessment.processingCompletedAt = new Date();
await assessment.save();