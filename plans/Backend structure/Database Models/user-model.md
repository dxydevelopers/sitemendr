# Backend Structure - User Database Model

## Overview
The User model represents registered users of the Sitemendr platform, including clients, administrators, and team members. It handles authentication, profile data, and role-based access control.

## Schema Definition

### MongoDB Schema
```javascript
const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
    minlength: [2, 'Name must be at least 2 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never include in queries by default
  },

  // Contact Information
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },

  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },

  // Account Status
  verified: {
    type: Boolean,
    default: false
  },

  banned: {
    type: Boolean,
    default: false
  },

  banReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Ban reason cannot exceed 500 characters']
  },

  // Role & Permissions
  role: {
    type: String,
    enum: ['client', 'admin', 'manager', 'developer'],
    default: 'client'
  },

  permissions: [{
    type: String,
    enum: [
      'read_projects',
      'write_projects',
      'delete_projects',
      'read_users',
      'write_users',
      'delete_users',
      'read_payments',
      'write_payments',
      'system_admin'
    ]
  }],

  // Business Information
  businessType: {
    type: String,
    enum: [
      'ecommerce',
      'service',
      'restaurant',
      'healthcare',
      'real_estate',
      'education',
      'non_profit',
      'other'
    ]
  },

  businessSize: {
    type: String,
    enum: [
      'sole_proprietor',
      'small_business', // 2-10 employees
      'medium_business', // 11-50 employees
      'large_business', // 51-200 employees
      'enterprise' // 200+ employees
    ]
  },

  // Lead & Conversion Tracking
  leadSource: {
    type: String,
    enum: [
      'organic_search',
      'paid_search',
      'social_media',
      'referral',
      'direct',
      'assessment',
      'homepage',
      'pricing_page'
    ]
  },

  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Authentication Tokens
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  passwordResetToken: String,
  passwordResetExpires: Date,

  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    userAgent: String,
    ipAddress: String
  }],

  // Activity Tracking
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },

  lastFailedLogin: Date,

  accountLockedUntil: Date,

  // Communication Preferences
  emailPreferences: {
    marketing: {
      type: Boolean,
      default: true
    },
    projectUpdates: {
      type: Boolean,
      default: true
    },
    securityAlerts: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    }
  },

  // Profile Completion
  profileComplete: {
    type: Boolean,
    default: false
  },

  completedSteps: [{
    step: {
      type: String,
      enum: [
        'basic_info',
        'business_info',
        'contact_preferences',
        'verification'
      ]
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  referralCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

## Indexes

### Performance Indexes
```javascript
// Unique email index (automatically created by unique: true)
userSchema.index({ email: 1 }, { unique: true });

// Role-based queries
userSchema.index({ role: 1 });

// Lead management
userSchema.index({ leadScore: -1 });
userSchema.index({ leadSource: 1 });

// Business segmentation
userSchema.index({ businessType: 1, businessSize: 1 });

// Activity monitoring
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });

// Authentication security
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });
userSchema.index({ 'refreshTokens.token': 1 });

// Referral system
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
userSchema.index({ referredBy: 1 });
```

## Virtual Properties

### Full Profile Completion
```javascript
userSchema.virtual('isProfileComplete').get(function() {
  return this.completedSteps.length >= 4;
});
```

### Account Age
```javascript
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});
```

### Active Status
```javascript
userSchema.virtual('isActive').get(function() {
  if (this.banned) return false;
  if (!this.verified) return false;
  if (this.accountLockedUntil && this.accountLockedUntil > Date.now()) return false;
  return true;
});
```

## Instance Methods

### Password Management
```javascript
// Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};
```

### Security Methods
```javascript
// Record failed login attempt
userSchema.methods.recordFailedLogin = function() {
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();

  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }
};

// Reset failed login attempts
userSchema.methods.resetFailedLogins = function() {
  this.failedLoginAttempts = 0;
  this.lastFailedLogin = undefined;
  this.accountLockedUntil = undefined;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};
```

### Profile Methods
```javascript
// Update profile completion
userSchema.methods.updateProfileCompletion = function(step) {
  if (!this.completedSteps.some(s => s.step === step)) {
    this.completedSteps.push({ step });
    this.profileComplete = this.completedSteps.length >= 4;
  }
};

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  this.referralCode = this._id.toString().slice(-8).toUpperCase();
};
```

## Static Methods

### User Queries
```javascript
// Find active users
userSchema.statics.findActive = function() {
  return this.find({
    banned: false,
    verified: true,
    $or: [
      { accountLockedUntil: { $exists: false } },
      { accountLockedUntil: { $lt: new Date() } }
    ]
  });
};

// Find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, banned: false });
};

// Find leads for follow-up
userSchema.statics.findLeadsForFollowUp = function(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    verified: false,
    createdAt: { $lt: cutoffDate },
    banned: false
  });
};
```

## Middleware

### Pre-save Middleware
```javascript
// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update updatedAt timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate referral code for new users
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.generateReferralCode();
  }
  next();
});
```

### Post-save Middleware
```javascript
// Send welcome email for new users
userSchema.post('save', async function(doc) {
  if (this.isNew) {
    // Trigger welcome email sequence
    await sendWelcomeEmail(doc);
  }
});
```

## Validation Rules

### Custom Validators
```javascript
// Strong password validation
userSchema.path('password').validate(function(value) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  return regex.test(value);
}, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Phone number validation
userSchema.path('phone').validate(function(value) {
  if (!value) return true; // Optional field
  const regex = /^\+?[\d\s\-\(\)]{10,}$/;
  return regex.test(value);
}, 'Please enter a valid phone number');
```

## Data Relationships

### Referenced Documents
- **Subscriptions:** One-to-many relationship with Subscription model
- **Projects:** One-to-many relationship with Project model
- **Payments:** One-to-many relationship with Payment model
- **Referrals:** Self-referencing for referral system

### Population Paths
```javascript
// Populate user with subscriptions
const userWithSubscriptions = await User.findById(id)
  .populate('subscriptions')
  .exec();

// Populate referred users
const userWithReferrals = await User.findById(id)
  .populate('referredUsers')
  .exec();
```

## Security Considerations

### Data Encryption
- Passwords: Bcrypt with 12 salt rounds
- Sensitive tokens: SHA-256 hashed before storage
- PII data: Encrypted at rest (future implementation)

### Access Control
- Role-based permissions system
- Field-level security for sensitive data
- API rate limiting per user
- Audit logging for all changes

### Data Retention
- Active users: Indefinite retention
- Deleted users: 30-day grace period, then anonymized
- Failed login data: 90-day retention
- Audit logs: 7-year retention for compliance

## Performance Optimization

### Read Optimization
- Strategic indexing for common queries
- Query result caching in Redis
- Database connection pooling
- Read replicas for high-traffic queries

### Write Optimization
- Bulk operations for batch updates
- Asynchronous processing for non-critical updates
- Database transaction management
- Write-ahead logging for data integrity

## Monitoring & Analytics

### Key Metrics
- User registration rate
- Account verification rate
- Login success rate
- Profile completion rate
- Account churn rate

### Alert Triggers
- High failed login rate
- Unusual account activity
- Mass account creation attempts
- Database performance degradation

## Migration Strategy

### Data Migration
- Existing user data migration scripts
- Password re-hashing for security
- Email verification for legacy accounts
- Role assignment based on historical data

### Backward Compatibility
- API versioning for smooth transitions
- Feature flags for gradual rollouts
- Fallback mechanisms for legacy data

## Testing Strategy

### Unit Tests
- Schema validation tests
- Instance method tests
- Static method tests
- Middleware functionality tests

### Integration Tests
- Full user lifecycle tests
- Authentication flow tests
- Data relationship tests
- Performance benchmark tests

### Security Tests
- SQL injection prevention
- Data exposure prevention
- Authentication bypass attempts
- Rate limiting effectiveness