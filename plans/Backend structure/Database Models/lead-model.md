# Backend Structure - Lead Database Model

## Overview
The Lead model represents qualified prospects generated from AI assessments, website forms, and other lead capture mechanisms. It serves as the primary data structure for the CRM system and sales pipeline management.

## Schema Definition

### MongoDB Schema
```javascript
const leadSchema = new mongoose.Schema({
  // Lead Source Information
  source: {
    type: String,
    enum: ['assessment', 'contact_form', 'newsletter', 'referral', 'social', 'direct', 'paid_ad'],
    required: [true, 'Lead source is required'],
    index: true
  },

  sourceDetails: {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },

    campaignId: {
      type: String,
      trim: true
    },

    referrer: {
      type: String,
      trim: true
    },

    landingPage: {
      type: String,
      trim: true
    }
  },

  // Contact Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },

  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },

  // Company Information
  company: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },

    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+$/, 'Please enter a valid URL']
    },

    industry: {
      type: String,
      trim: true,
      maxlength: [50, 'Industry cannot exceed 50 characters']
    },

    size: {
      type: String,
      enum: ['1-5', '6-20', '21-50', '51-100', '100+']
    }
  },

  // Lead Qualification Data
  qualification: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurture'],
      default: 'new',
      index: true
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    budget: {
      type: String,
      enum: ['under_1000', '1000_3000', '3000_5000', '5000_10000', 'over_10000']
    },

    timeline: {
      type: String,
      enum: ['asap', '1_month', '2_3_months', '3_6_months', 'flexible']
    },

    requirements: [{
      type: String,
      trim: true
    }],

    painPoints: [{
      type: String,
      trim: true
    }]
  },

  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'meeting', 'note'],
      required: true
    },

    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },

    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },

    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters']
    },

    sentAt: {
      type: Date,
      default: Date.now
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Assignment & Ownership
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Marketing Consent & Compliance
  consent: {
    marketing: {
      type: Boolean,
      default: false
    },

    analytics: {
      type: Boolean,
      default: true
    },

    thirdParty: {
      type: Boolean,
      default: false
    },

    consentDate: {
      type: Date,
      default: Date.now
    },

    ipAddress: {
      type: String,
      trim: true
    },

    userAgent: {
      type: String,
      trim: true
    }
  },

  // Conversion Tracking
  converted: {
    type: Boolean,
    default: false
  },

  convertedAt: {
    type: Date
  },

  convertedTo: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    }
  },

  // Follow-up Scheduling
  nextFollowUp: {
    type: Date,
    index: true
  },

  followUpNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Follow-up notes cannot exceed 500 characters']
  },

  // Tags & Segmentation
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ 'qualification.status': 1, 'qualification.priority': 1 });
leadSchema.index({ 'company.industry': 1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ 'consent.marketing': 1 });
leadSchema.index({ tags: 1 });

// Pre-save middleware
leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();
  next();
});

// Virtual for full name split
leadSchema.virtual('firstName').get(function() {
  return this.name.split(' ')[0];
});

leadSchema.virtual('lastName').get(function() {
  const parts = this.name.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
});

// Method to calculate qualification score
leadSchema.methods.calculateScore = function() {
  let score = 0;

  // Source scoring
  const sourceScores = {
    'assessment': 80,
    'contact_form': 60,
    'referral': 70,
    'paid_ad': 50,
    'social': 40,
    'newsletter': 30,
    'direct': 20
  };
  score += sourceScores[this.source] || 0;

  // Budget scoring
  const budgetScores = {
    'over_10000': 30,
    '5000_10000': 25,
    '3000_5000': 20,
    '1000_3000': 15,
    'under_1000': 10
  };
  if (this.qualification.budget) {
    score += budgetScores[this.qualification.budget] || 0;
  }

  // Timeline scoring (ASAP is highest priority)
  if (this.qualification.timeline === 'asap') {
    score += 20;
  } else if (this.qualification.timeline === '1_month') {
    score += 15;
  }

  // Company size scoring
  const sizeScores = {
    '100+': 15,
    '51-100': 12,
    '21-50': 10,
    '6-20': 8,
    '1-5': 5
  };
  if (this.company.size) {
    score += sizeScores[this.company.size] || 0;
  }

  // Cap at 100
  this.qualification.score = Math.min(score, 100);
  return this.qualification.score;
};

// Method to add communication
leadSchema.methods.addCommunication = function(communication) {
  this.communications.push({
    ...communication,
    sentAt: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

// Method to update status
leadSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.qualification.status = newStatus;
  if (notes) {
    this.addCommunication({
      type: 'note',
      direction: 'outbound',
      content: `Status updated to ${newStatus}: ${notes}`
    });
  }
  return this.save();
};

module.exports = mongoose.model('Lead', leadSchema);
```

## Key Features

### Comprehensive Lead Tracking
- Source attribution for marketing analytics
- Detailed qualification scoring
- Communication history logging
- Status tracking through sales pipeline

### GDPR Compliance
- Granular consent management
- Data retention controls
- Audit trail for consent changes

### Sales Pipeline Integration
- Assignment to sales representatives
- Priority scoring and routing
- Follow-up scheduling
- Conversion tracking

### Segmentation & Analytics
- Tagging system for categorization
- Industry and company size tracking
- Budget and timeline analysis
- Performance metrics calculation

## Usage Examples

### Creating New Lead from Assessment
```javascript
const lead = new Lead({
  source: 'assessment',
  sourceDetails: {
    assessmentId: assessment._id
  },
  name: assessment.responses.name,
  email: assessment.responses.email,
  phone: assessment.responses.phone,
  company: {
    name: assessment.responses.companyName
  },
  qualification: {
    budget: assessment.responses.budget,
    timeline: assessment.responses.timeline,
    requirements: assessment.responses.requiredFeatures
  }
});

lead.calculateScore();
await lead.save();
```

### Updating Lead Status
```javascript
await lead.updateStatus('qualified', 'Lead shows high intent, budget approved');
```

### Adding Communication
```javascript
await lead.addCommunication({
  type: 'email',
  direction: 'outbound',
  subject: 'Project Proposal',
  content: 'Attached is our detailed proposal...'
});