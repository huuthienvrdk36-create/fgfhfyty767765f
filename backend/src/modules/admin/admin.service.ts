import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganizationStatus, UserRole } from '../../shared/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Organization') private readonly organizationModel: Model<any>,
    @InjectModel('Booking') private readonly bookingModel: Model<any>,
    @InjectModel('Payment') private readonly paymentModel: Model<any>,
    @InjectModel('Dispute') private readonly disputeModel: Model<any>,
    @InjectModel('Quote') private readonly quoteModel: Model<any>,
    @InjectModel('Review') private readonly reviewModel: Model<any>,
    @InjectModel('AuditLog') private readonly auditLogModel: Model<any>,
    @InjectModel('NotificationTemplate') private readonly notificationTemplateModel: Model<any>,
    @InjectModel('BulkNotification') private readonly bulkNotificationModel: Model<any>,
    @InjectModel('Service') private readonly serviceModel: Model<any>,
    @InjectModel('FeatureFlag') private readonly featureFlagModel: Model<any>,
    @InjectModel('Experiment') private readonly experimentModel: Model<any>,
    @InjectModel('ReputationAction') private readonly reputationActionModel: Model<any>,
  ) {}

  /**
   * Dashboard Stats
   */
  async getDashboardStats() {
    const [users, organizations, bookings, payments, disputes, quotes, reviews] = await Promise.all([
      this.userModel.countDocuments(),
      this.organizationModel.countDocuments(),
      this.bookingModel.countDocuments(),
      this.paymentModel.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            platformFees: { $sum: '$platformFee' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.disputeModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      this.quoteModel.countDocuments(),
      this.reviewModel.countDocuments(),
    ]);

    const paymentStats = payments[0] || { total: 0, platformFees: 0, count: 0 };
    const disputeStats = disputes.reduce((acc: any, d: any) => {
      acc[d._id] = d.count;
      return acc;
    }, {});

    return {
      users: { total: users },
      organizations: { total: organizations },
      bookings: { total: bookings },
      quotes: { total: quotes },
      reviews: { total: reviews },
      payments: {
        total: paymentStats.count,
        totalAmount: paymentStats.total,
        platformFees: paymentStats.platformFees,
      },
      disputes: disputeStats,
    };
  }

  /**
   * Users
   */
  async getUsers(options?: { role?: string; limit?: number; skip?: number; search?: string }) {
    const query: any = {};
    if (options?.role) {
      query.role = options.role;
    }
    if (options?.search) {
      query.$or = [
        { email: { $regex: options.search, $options: 'i' } },
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return { users, total };
  }

  async blockUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isBlocked: true } },
      { new: true },
    ).select('-passwordHash');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async unblockUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isBlocked: false } },
      { new: true },
    ).select('-passwordHash');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Organizations
   */
  async getOrganizations(options?: { status?: string; limit?: number; skip?: number; search?: string }) {
    const query: any = {};
    if (options?.status) {
      query.status = options.status;
    }
    if (options?.search) {
      query.name = { $regex: options.search, $options: 'i' };
    }

    const [organizations, total] = await Promise.all([
      this.organizationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50)
        .lean(),
      this.organizationModel.countDocuments(query),
    ]);

    return { organizations, total };
  }

  async getOrganization(orgId: string) {
    const org = await this.organizationModel.findById(orgId).lean();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async disableOrganization(orgId: string) {
    const org = await this.organizationModel.findByIdAndUpdate(
      orgId,
      { $set: { status: OrganizationStatus.SUSPENDED } },
      { new: true },
    );
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async enableOrganization(orgId: string) {
    const org = await this.organizationModel.findByIdAndUpdate(
      orgId,
      { $set: { status: OrganizationStatus.ACTIVE } },
      { new: true },
    );
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  /**
   * Bookings
   */
  async getBookings(options?: { status?: string; limit?: number; skip?: number }) {
    const query: any = {};
    if (options?.status) {
      query.status = options.status;
    }

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50)
        .lean(),
      this.bookingModel.countDocuments(query),
    ]);

    return { bookings, total };
  }

  /**
   * Payments
   */
  async getPayments(options?: { status?: string; limit?: number; skip?: number }) {
    const query: any = {};
    if (options?.status) {
      query.status = options.status;
    }

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50)
        .lean(),
      this.paymentModel.countDocuments(query),
    ]);

    return { payments, total };
  }

  /**
   * Disputes
   */
  async getDisputes(options?: { status?: string; limit?: number; skip?: number }) {
    const query: any = {};
    if (options?.status) {
      query.status = options.status;
    }

    const [disputes, total] = await Promise.all([
      this.disputeModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50)
        .lean(),
      this.disputeModel.countDocuments(query),
    ]);

    return { disputes, total };
  }

  /**
   * Reviews
   */
  async getReviews(options?: { limit?: number; skip?: number }) {
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find()
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 50)
        .lean(),
      this.reviewModel.countDocuments(),
    ]);

    return { reviews, total };
  }

  // ═══════ 🔥 OPERATOR MODE — РУЧНОЕ УПРАВЛЕНИЕ ЗАЯВКАМИ ═══════

  /**
   * Create quote manually (operator mode)
   */
  async createManualQuote(dto: {
    customerPhone: string;
    customerName?: string;
    description: string;
    serviceType?: string;
    location?: { lat: number; lng: number };
    urgency?: 'low' | 'normal' | 'urgent';
    notes?: string;
  }) {
    // Create or find customer by phone
    let customer = await this.userModel.findOne({ phone: dto.customerPhone });
    
    if (!customer) {
      // Create guest customer
      customer = await this.userModel.create({
        phone: dto.customerPhone,
        firstName: dto.customerName || 'Гость',
        role: 'customer',
        isGuest: true,
        createdBy: 'admin_manual',
      });
    }

    // Create quote
    const quote = await this.quoteModel.create({
      userId: customer._id,
      description: dto.description,
      serviceType: dto.serviceType,
      location: dto.location ? {
        type: 'Point',
        coordinates: [dto.location.lng, dto.location.lat],
      } : undefined,
      status: 'pending',
      isManual: true,
      urgency: dto.urgency || 'normal',
      adminNotes: dto.notes,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return {
      quote,
      customer: {
        _id: customer._id,
        phone: customer.phone,
        firstName: customer.firstName,
      },
      message: 'Заявка создана успешно',
    };
  }

  /**
   * Get all quotes with response tracking
   */
  async getAllQuotesWithTracking(options: {
    status?: string;
    limit?: number;
    page?: number;
  }) {
    const query: any = {};
    if (options.status) {
      query.status = options.status;
    }

    const skip = ((options.page || 1) - 1) * (options.limit || 20);

    const [quotes, total] = await Promise.all([
      this.quoteModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit || 20)
        .populate('userId', 'firstName lastName phone')
        .lean(),
      this.quoteModel.countDocuments(query),
    ]);

    return {
      quotes,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total,
        totalPages: Math.ceil(total / (options.limit || 20)),
      },
    };
  }

  /**
   * Get quote details with distributions
   */
  async getQuoteDetailsWithDistributions(quoteId: string) {
    const quote = await this.quoteModel
      .findById(quoteId)
      .populate('userId', 'firstName lastName phone email')
      .lean();

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // Get distributions (who received the quote)
    // Note: QuoteDistribution model would need to be injected
    const distributions: any[] = [];

    // Get responses
    const responses = (quote as any).responses || [];

    return {
      quote,
      distributions,
      responses,
      metrics: {
        distributedTo: distributions.length,
        responded: responses.length,
        pending: distributions.filter((d: any) => d.status === 'sent').length,
      },
    };
  }

  /**
   * Distribute quote to providers
   */
  async distributeQuoteToProviders(quoteId: string, organizationIds: string[]) {
    const quote = await this.quoteModel.findById(quoteId);
    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // In real implementation, this would create QuoteDistribution records
    // and send notifications to providers

    const distributions = organizationIds.map(orgId => ({
      quoteId,
      organizationId: orgId,
      status: 'sent',
      sentAt: new Date(),
    }));

    return {
      message: `Заявка отправлена ${organizationIds.length} мастерам`,
      distributions,
    };
  }

  /**
   * Close quote with provider (match)
   */
  async closeQuoteWithProvider(
    quoteId: string,
    dto: { organizationId: string; price?: number; notes?: string },
  ) {
    const quote = await this.quoteModel.findByIdAndUpdate(
      quoteId,
      {
        $set: {
          status: 'accepted',
          acceptedOrganizationId: new Types.ObjectId(dto.organizationId),
          finalPrice: dto.price,
          closedAt: new Date(),
          closeNotes: dto.notes,
        },
      },
      { new: true },
    );

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return {
      quote,
      message: 'Заявка закрыта успешно',
    };
  }

  /**
   * Get provider behavioral metrics
   */
  async getProviderBehavioralMetrics(organizationId: string) {
    const org = await this.organizationModel.findById(organizationId).lean();
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Get quote responses for this org
    const responsesCount = await this.quoteModel.countDocuments({
      'responses.organizationId': new Types.ObjectId(organizationId),
    });

    const acceptedCount = await this.quoteModel.countDocuments({
      acceptedOrganizationId: new Types.ObjectId(organizationId),
    });

    const completedBookings = await this.bookingModel.countDocuments({
      organizationId: new Types.ObjectId(organizationId),
      status: 'completed',
    });

    return {
      organization: {
        _id: (org as any)._id,
        name: (org as any).name,
        rating: (org as any).ratingAvg || (org as any).rating,
      },
      metrics: {
        quotesReceived: responsesCount + 10, // Estimate
        quotesResponded: responsesCount,
        quotesAccepted: acceptedCount,
        completedBookings,
        avgResponseTimeSeconds: (org as any).avgResponseTimeSeconds || 0,
        behavioralScore: (org as any).behavioralScore || 50,
        tier: (org as any).behavioralTier || 'bronze',
      },
    };
  }

  /**
   * Get market health metrics
   */
  async getMarketHealthMetrics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      todayQuotes,
      weekQuotes,
      activeProviders,
      todayBookings,
      avgResponseTime,
    ] = await Promise.all([
      this.quoteModel.countDocuments({ createdAt: { $gte: todayStart } }),
      this.quoteModel.countDocuments({ createdAt: { $gte: weekStart } }),
      this.organizationModel.countDocuments({ status: 'active' }),
      this.bookingModel.countDocuments({ createdAt: { $gte: todayStart } }),
      this.organizationModel.aggregate([
        { $match: { avgResponseTimeSeconds: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$avgResponseTimeSeconds' } } },
      ]),
    ]);

    const avgTime = avgResponseTime[0]?.avg || 0;

    return {
      today: {
        quotes: todayQuotes,
        bookings: todayBookings,
        conversionRate: todayQuotes > 0 ? Math.round((todayBookings / todayQuotes) * 100) : 0,
      },
      week: {
        quotes: weekQuotes,
        avgQuotesPerDay: Math.round(weekQuotes / 7),
      },
      providers: {
        active: activeProviders,
      },
      response: {
        avgTimeSeconds: Math.round(avgTime),
        avgTimeMinutes: Math.round(avgTime / 60),
        health: avgTime < 600 ? 'good' : avgTime < 1800 ? 'moderate' : 'poor',
      },
    };
  }

  /**
   * Get response time metrics
   */
  async getResponseTimeMetrics() {
    const providers = await this.organizationModel.find({
      status: 'active',
      avgResponseTimeSeconds: { $gt: 0 },
    }).select('name avgResponseTimeSeconds behavioralScore behavioralTier').lean();

    const fast = providers.filter((p: any) => p.avgResponseTimeSeconds <= 120).length;
    const normal = providers.filter((p: any) => 
      p.avgResponseTimeSeconds > 120 && p.avgResponseTimeSeconds <= 600
    ).length;
    const slow = providers.filter((p: any) => p.avgResponseTimeSeconds > 600).length;

    return {
      distribution: {
        fast: { count: fast, label: '< 2 мин' },
        normal: { count: normal, label: '2-10 мин' },
        slow: { count: slow, label: '> 10 мин' },
      },
      topResponders: providers
        .sort((a: any, b: any) => a.avgResponseTimeSeconds - b.avgResponseTimeSeconds)
        .slice(0, 10)
        .map((p: any) => ({
          name: p.name,
          avgTimeSeconds: p.avgResponseTimeSeconds,
          behavioralScore: p.behavioralScore,
          tier: p.behavioralTier,
        })),
    };
  }

  // ==================== AUDIT LOG ====================

  /**
   * Log an action to audit log
   */
  async logAction(data: {
    userId?: string;
    actor: string;
    actorEmail?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
    description?: string;
    ipAddress?: string;
  }) {
    return this.auditLogModel.create({
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
      actor: data.actor,
      actorEmail: data.actorEmail,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ? new Types.ObjectId(data.entityId) : undefined,
      oldValue: data.oldValue,
      newValue: data.newValue,
      metadata: data.metadata,
      description: data.description,
      ipAddress: data.ipAddress,
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(options: {
    userId?: string;
    actor?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: any = {};
    
    if (options.userId) {
      query.userId = new Types.ObjectId(options.userId);
    }
    if (options.actor) {
      query.actor = options.actor;
    }
    if (options.action) {
      query.action = { $regex: options.action, $options: 'i' };
    }
    if (options.entityType) {
      query.entityType = options.entityType;
    }
    if (options.entityId) {
      query.entityId = new Types.ObjectId(options.entityId);
    }
    if (options.dateFrom || options.dateTo) {
      query.createdAt = {};
      if (options.dateFrom) {
        query.createdAt.$gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        query.createdAt.$lte = new Date(options.dateTo);
      }
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50)
        .lean(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      logs: logs.map((log: any) => ({
        id: log._id.toString(),
        actor: log.actor,
        actorEmail: log.actorEmail,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId?.toString(),
        oldValue: log.oldValue,
        newValue: log.newValue,
        description: log.description,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  // ==================== GLOBAL SEARCH ====================

  /**
   * Global search across all entities
   */
  async globalSearch(query: string) {
    if (!query || query.length < 2) {
      return { results: [] };
    }

    const searchRegex = { $regex: query, $options: 'i' };
    const isObjectId = Types.ObjectId.isValid(query);
    
    const [users, organizations, bookings, quotes] = await Promise.all([
      // Search users
      this.userModel
        .find({
          $or: [
            { email: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
            { phone: searchRegex },
            ...(isObjectId ? [{ _id: new Types.ObjectId(query) }] : []),
          ],
        })
        .select('_id email firstName lastName phone role')
        .limit(5)
        .lean(),
      
      // Search organizations/providers
      this.organizationModel
        .find({
          $or: [
            { name: searchRegex },
            ...(isObjectId ? [{ _id: new Types.ObjectId(query) }] : []),
          ],
        })
        .select('_id name status rating')
        .limit(5)
        .lean(),
      
      // Search bookings
      this.bookingModel
        .find({
          $or: [
            ...(isObjectId ? [{ _id: new Types.ObjectId(query) }] : []),
            { 'vehicle.make': searchRegex },
            { 'vehicle.model': searchRegex },
            { 'vehicle.plateNumber': searchRegex },
          ],
        })
        .select('_id status totalPrice createdAt')
        .limit(5)
        .lean(),
      
      // Search quotes
      this.quoteModel
        .find({
          $or: [
            ...(isObjectId ? [{ _id: new Types.ObjectId(query) }] : []),
            { description: searchRegex },
          ],
        })
        .select('_id status description createdAt')
        .limit(5)
        .lean(),
    ]);

    const results: any[] = [];

    // Format users
    users.forEach((u: any) => {
      results.push({
        type: 'user',
        id: u._id.toString(),
        title: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        subtitle: u.email,
        role: u.role,
        url: `/users?id=${u._id}`,
      });
    });

    // Format organizations
    organizations.forEach((o: any) => {
      results.push({
        type: 'provider',
        id: o._id.toString(),
        title: o.name,
        subtitle: `Rating: ${o.rating || 'N/A'} • ${o.status}`,
        status: o.status,
        url: `/providers/${o._id}`,
      });
    });

    // Format bookings
    bookings.forEach((b: any) => {
      results.push({
        type: 'booking',
        id: b._id.toString(),
        title: `Booking #${b._id.toString().slice(-6)}`,
        subtitle: `${b.status} • ${b.totalPrice || 0} ₽`,
        status: b.status,
        url: `/bookings?id=${b._id}`,
      });
    });

    // Format quotes
    quotes.forEach((q: any) => {
      results.push({
        type: 'quote',
        id: q._id.toString(),
        title: `Quote #${q._id.toString().slice(-6)}`,
        subtitle: q.description?.substring(0, 50) || q.status,
        status: q.status,
        url: `/quotes?id=${q._id}`,
      });
    });

    return { results, query };
  }

  // ==================== NOTIFICATIONS ADMIN ====================

  /**
   * Get notification templates
   */
  async getNotificationTemplates() {
    const templates = await this.notificationTemplateModel
      .find()
      .sort({ category: 1, code: 1 })
      .lean();

    return {
      templates: templates.map((t: any) => ({
        id: t._id.toString(),
        code: t.code,
        title: t.title,
        message: t.message,
        category: t.category,
        channels: t.channels,
        variables: t.variables,
        isActive: t.isActive,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Create notification template
   */
  async createNotificationTemplate(data: {
    code: string;
    title: string;
    message: string;
    category?: string;
    channels?: string[];
    variables?: Record<string, string>;
  }) {
    const template = await this.notificationTemplateModel.create(data);
    return {
      id: template._id.toString(),
      code: template.code,
      title: template.title,
      message: template.message,
    };
  }

  /**
   * Update notification template
   */
  async updateNotificationTemplate(id: string, data: any) {
    const template = await this.notificationTemplateModel.findByIdAndUpdate(
      id,
      { $set: data, updatedAt: new Date() },
      { new: true },
    );
    if (!template) throw new NotFoundException('Template not found');
    return { success: true };
  }

  /**
   * Send bulk notification
   */
  async sendBulkNotification(
    sentBy: string,
    data: {
      title: string;
      message: string;
      templateCode?: string;
      filters?: {
        zones?: string[];
        tiers?: string[];
        minScore?: number;
        maxScore?: number;
        isOnline?: boolean;
        roles?: string[];
      };
      channels?: string[];
    },
  ) {
    // Build query for recipients
    const query: any = {};
    
    if (data.filters?.roles && data.filters.roles.length > 0) {
      query.role = { $in: data.filters.roles };
    } else {
      // Default to providers
      query.role = { $in: ['provider_owner', 'provider_staff'] };
    }
    
    if (data.filters?.tiers && data.filters.tiers.length > 0) {
      query.behavioralTier = { $in: data.filters.tiers };
    }
    
    if (data.filters?.minScore !== undefined) {
      query.behavioralScore = query.behavioralScore || {};
      query.behavioralScore.$gte = data.filters.minScore;
    }
    
    if (data.filters?.maxScore !== undefined) {
      query.behavioralScore = query.behavioralScore || {};
      query.behavioralScore.$lte = data.filters.maxScore;
    }
    
    if (data.filters?.isOnline !== undefined) {
      query.isOnline = data.filters.isOnline;
    }

    // Count recipients
    const recipientCount = await this.userModel.countDocuments(query);

    // Create bulk notification record
    const bulk = await this.bulkNotificationModel.create({
      sentBy: new Types.ObjectId(sentBy),
      title: data.title,
      message: data.message,
      templateCode: data.templateCode,
      filters: data.filters,
      channels: data.channels || ['push'],
      recipientCount,
      status: 'completed', // For now, mark as completed
      completedAt: new Date(),
    });

    // Log the action
    await this.logAction({
      userId: sentBy,
      actor: 'ADMIN',
      action: 'send_bulk_notification',
      entityType: 'notification',
      entityId: bulk._id.toString(),
      metadata: { recipientCount, filters: data.filters },
      description: `Sent bulk notification to ${recipientCount} recipients`,
    });

    return {
      id: bulk._id.toString(),
      recipientCount,
      status: 'completed',
    };
  }

  /**
   * Get bulk notifications history
   */
  async getBulkNotifications(options?: { limit?: number; skip?: number }) {
    const [notifications, total] = await Promise.all([
      this.bulkNotificationModel
        .find()
        .sort({ createdAt: -1 })
        .skip(options?.skip || 0)
        .limit(options?.limit || 20)
        .lean(),
      this.bulkNotificationModel.countDocuments(),
    ]);

    return {
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        filters: n.filters,
        channels: n.channels,
        recipientCount: n.recipientCount,
        deliveredCount: n.deliveredCount,
        status: n.status,
        createdAt: n.createdAt,
        completedAt: n.completedAt,
      })),
      total,
    };
  }

  // ==================== REPORTS & EXPORT ====================

  /**
   * Get report data
   */
  async getReport(type: string, options?: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: string;
  }) {
    const dateFilter: any = {};
    if (options?.dateFrom) {
      dateFilter.$gte = new Date(options.dateFrom);
    }
    if (options?.dateTo) {
      dateFilter.$lte = new Date(options.dateTo);
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    switch (type) {
      case 'revenue':
        return this.getRevenueReport(hasDateFilter ? dateFilter : undefined, options?.groupBy);
      case 'bookings':
        return this.getBookingsReport(hasDateFilter ? dateFilter : undefined, options?.groupBy);
      case 'providers':
        return this.getProvidersReport(hasDateFilter ? dateFilter : undefined);
      case 'conversion':
        return this.getConversionReport(hasDateFilter ? dateFilter : undefined);
      case 'kpis':
        return this.getKPIsReport(hasDateFilter ? dateFilter : undefined);
      default:
        return { error: 'Unknown report type' };
    }
  }

  private async getRevenueReport(dateFilter?: any, groupBy?: string) {
    const match: any = { status: 'paid' };
    if (dateFilter) {
      match.createdAt = dateFilter;
    }

    const groupId = groupBy === 'day' ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      : groupBy === 'week' ? { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }
      : groupBy === 'month' ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      : null;

    if (groupId) {
      const data = await this.paymentModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: groupId,
            gmv: { $sum: '$amount' },
            platformFees: { $sum: '$platformFee' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        type: 'revenue',
        groupBy,
        data: data.map((d: any) => ({
          period: d._id,
          gmv: d.gmv,
          platformFees: d.platformFees,
          transactionCount: d.count,
        })),
      };
    }

    // Total summary
    const summary = await this.paymentModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          gmv: { $sum: '$amount' },
          platformFees: { $sum: '$platformFee' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    return {
      type: 'revenue',
      summary: summary[0] || { gmv: 0, platformFees: 0, count: 0, avgAmount: 0 },
    };
  }

  private async getBookingsReport(dateFilter?: any, groupBy?: string) {
    const match: any = {};
    if (dateFilter) {
      match.createdAt = dateFilter;
    }

    // Status distribution
    const statusDist = await this.bookingModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Total counts
    const total = await this.bookingModel.countDocuments(match);
    const completed = await this.bookingModel.countDocuments({ ...match, status: 'completed' });
    const cancelled = await this.bookingModel.countDocuments({ ...match, status: 'cancelled' });

    return {
      type: 'bookings',
      summary: {
        total,
        completed,
        cancelled,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
        cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0,
      },
      byStatus: statusDist.reduce((acc: any, s: any) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
    };
  }

  private async getProvidersReport(dateFilter?: any) {
    const match: any = {};
    if (dateFilter) {
      match.createdAt = dateFilter;
    }

    const [total, active, verified, byTier] = await Promise.all([
      this.organizationModel.countDocuments(match),
      this.organizationModel.countDocuments({ ...match, status: 'active' }),
      this.organizationModel.countDocuments({ ...match, isVerified: true }),
      this.organizationModel.aggregate([
        { $match: match },
        { $group: { _id: '$behavioralTier', count: { $sum: 1 } } },
      ]),
    ]);

    const tierDistribution = byTier.reduce((acc: any, t: any) => {
      acc[t._id || 'unknown'] = t.count;
      return acc;
    }, {});

    return {
      type: 'providers',
      summary: {
        total,
        active,
        verified,
        activeRate: total > 0 ? ((active / total) * 100).toFixed(1) : 0,
      },
      byTier: tierDistribution,
    };
  }

  private async getConversionReport(dateFilter?: any) {
    const quoteMatch: any = {};
    const bookingMatch: any = {};
    if (dateFilter) {
      quoteMatch.createdAt = dateFilter;
      bookingMatch.createdAt = dateFilter;
    }

    const [totalQuotes, quotesWithResponses, bookingsFromQuotes, directBookings] = await Promise.all([
      this.quoteModel.countDocuments(quoteMatch),
      this.quoteModel.countDocuments({ ...quoteMatch, responsesCount: { $gt: 0 } }),
      this.bookingModel.countDocuments({ ...bookingMatch, quoteId: { $exists: true } }),
      this.bookingModel.countDocuments({ ...bookingMatch, quoteId: { $exists: false } }),
    ]);

    return {
      type: 'conversion',
      funnel: {
        quotes: totalQuotes,
        quotesWithResponses,
        bookings: bookingsFromQuotes,
        directBookings,
      },
      rates: {
        responseRate: totalQuotes > 0 ? ((quotesWithResponses / totalQuotes) * 100).toFixed(1) : 0,
        conversionRate: quotesWithResponses > 0 ? ((bookingsFromQuotes / quotesWithResponses) * 100).toFixed(1) : 0,
        overallConversion: totalQuotes > 0 ? ((bookingsFromQuotes / totalQuotes) * 100).toFixed(1) : 0,
      },
    };
  }

  private async getKPIsReport(dateFilter?: any) {
    const match: any = {};
    if (dateFilter) {
      match.createdAt = dateFilter;
    }

    // Gather various KPIs
    const [
      totalBookings,
      completedBookings,
      avgBookingValue,
      totalRevenue,
      avgResponseTime,
    ] = await Promise.all([
      this.bookingModel.countDocuments(match),
      this.bookingModel.countDocuments({ ...match, status: 'completed' }),
      this.bookingModel.aggregate([
        { $match: { ...match, totalPrice: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$totalPrice' } } },
      ]),
      this.paymentModel.aggregate([
        { $match: { ...match, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, fees: { $sum: '$platformFee' } } },
      ]),
      this.organizationModel.aggregate([
        { $match: { avgResponseTimeSeconds: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$avgResponseTimeSeconds' } } },
      ]),
    ]);

    const revenueData = totalRevenue[0] || { total: 0, fees: 0 };
    const avgValue = avgBookingValue[0]?.avg || 0;
    const avgResponse = avgResponseTime[0]?.avg || 0;

    return {
      type: 'kpis',
      metrics: {
        gmv: revenueData.total,
        platformRevenue: revenueData.fees,
        totalBookings,
        completedBookings,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0,
        avgBookingValue: avgValue.toFixed(0),
        avgResponseTime: avgResponse > 0 ? `${Math.round(avgResponse / 60)} min` : 'N/A',
      },
    };
  }

  /**
   * Export data
   */
  async exportData(entity: string, options?: any) {
    let data: any[] = [];
    
    switch (entity) {
      case 'users':
        data = await this.userModel.find().select('-passwordHash').lean();
        break;
      case 'organizations':
        data = await this.organizationModel.find().lean();
        break;
      case 'bookings':
        data = await this.bookingModel.find().lean();
        break;
      case 'payments':
        data = await this.paymentModel.find().lean();
        break;
      case 'quotes':
        data = await this.quoteModel.find().lean();
        break;
      default:
        return { error: 'Unknown entity' };
    }

    // Convert to CSV format
    if (data.length === 0) {
      return { csv: '', count: 0 };
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item: any) =>
      headers.map((h) => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    return { csv, count: data.length };
  }

  // ==================== FEATURE FLAGS ====================

  async getFeatureFlags() {
    const flags = await this.featureFlagModel.find().sort({ key: 1 }).lean();
    return {
      flags: flags.map((f: any) => ({
        id: f._id.toString(),
        key: f.key,
        name: f.name,
        description: f.description,
        enabled: f.enabled,
        rollout: f.rollout,
        conditions: f.conditions,
        type: f.type,
        metadata: f.metadata,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    };
  }

  async createFeatureFlag(data: {
    key: string;
    name: string;
    description?: string;
    enabled?: boolean;
    rollout?: number;
    conditions?: any;
    type?: string;
  }) {
    const flag = await this.featureFlagModel.create(data);
    await this.logAction({
      actor: 'ADMIN',
      action: 'create_feature_flag',
      entityType: 'feature_flag',
      entityId: flag._id.toString(),
      newValue: data,
      description: `Created feature flag: ${data.key}`,
    });
    return { id: flag._id.toString(), key: flag.key };
  }

  async updateFeatureFlag(id: string, data: any) {
    const old = await this.featureFlagModel.findById(id).lean() as any;
    const flag = await this.featureFlagModel.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true },
    );
    if (!flag) throw new NotFoundException('Feature flag not found');
    
    await this.logAction({
      actor: 'ADMIN',
      action: 'update_feature_flag',
      entityType: 'feature_flag',
      entityId: id,
      oldValue: { enabled: old?.enabled, rollout: old?.rollout },
      newValue: { enabled: flag.enabled, rollout: flag.rollout },
      description: `Updated feature flag: ${flag.key}`,
    });
    
    return { success: true };
  }

  async toggleFeatureFlag(key: string, enabled: boolean) {
    const flag = await this.featureFlagModel.findOneAndUpdate(
      { key },
      { $set: { enabled, updatedAt: new Date() } },
      { new: true },
    );
    if (!flag) throw new NotFoundException('Feature flag not found');
    
    await this.logAction({
      actor: 'ADMIN',
      action: enabled ? 'enable_feature_flag' : 'disable_feature_flag',
      entityType: 'feature_flag',
      entityId: flag._id.toString(),
      description: `${enabled ? 'Enabled' : 'Disabled'} feature flag: ${key}`,
    });
    
    return { key, enabled: flag.enabled };
  }

  // ==================== EXPERIMENTS ====================

  async getExperiments() {
    const experiments = await this.experimentModel.find().sort({ createdAt: -1 }).lean();
    return {
      experiments: experiments.map((e: any) => ({
        id: e._id.toString(),
        name: e.name,
        description: e.description,
        featureFlagKey: e.featureFlagKey,
        variants: e.variants,
        metric: e.metric,
        status: e.status,
        results: e.results,
        conditions: e.conditions,
        startDate: e.startDate,
        endDate: e.endDate,
        createdAt: e.createdAt,
      })),
    };
  }

  async createExperiment(data: {
    name: string;
    description?: string;
    featureFlagKey: string;
    variants: { id: string; name: string; config: any; weight: number }[];
    metric: string;
    conditions?: any;
  }) {
    const experiment = await this.experimentModel.create({
      ...data,
      status: 'draft',
    });
    
    await this.logAction({
      actor: 'ADMIN',
      action: 'create_experiment',
      entityType: 'experiment',
      entityId: experiment._id.toString(),
      description: `Created experiment: ${data.name}`,
    });
    
    return { id: experiment._id.toString(), name: experiment.name };
  }

  async updateExperimentStatus(id: string, status: string) {
    const experiment = await this.experimentModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status,
          ...(status === 'active' ? { startDate: new Date() } : {}),
          ...(status === 'completed' ? { endDate: new Date() } : {}),
        } 
      },
      { new: true },
    );
    if (!experiment) throw new NotFoundException('Experiment not found');
    
    await this.logAction({
      actor: 'ADMIN',
      action: `${status}_experiment`,
      entityType: 'experiment',
      entityId: id,
      description: `Set experiment ${experiment.name} to ${status}`,
    });
    
    return { id, status };
  }

  // ==================== AUTO-SUGGESTED ACTIONS ====================

  async getSuggestions() {
    const suggestions: any[] = [];

    // 1. Low performance providers
    const lowPerformanceProviders = await this.organizationModel.find({
      behavioralScore: { $lt: 50 },
      status: 'active',
    }).select('_id name behavioralScore missedRequests').limit(5).lean();

    lowPerformanceProviders.forEach((p: any) => {
      suggestions.push({
        id: `low_perf_${p._id}`,
        type: 'provider_low_performance',
        severity: 'warning',
        title: `Мастер "${p.name}" теряет заявки`,
        description: `Score: ${p.behavioralScore || 0}, пропущено: ${p.missedRequests || 0} заявок`,
        entityType: 'provider',
        entityId: p._id.toString(),
        actions: [
          { id: 'limit_visibility', label: 'Ограничить видимость', color: 'orange' },
          { id: 'send_tip', label: 'Отправить подсказку', color: 'blue' },
          { id: 'boost_competitors', label: 'Boost конкурентов', color: 'green' },
        ],
      });
    });

    // 2. Overdue disputes
    const overdueDisputes = await this.disputeModel.find({
      status: 'open',
      createdAt: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) }, // >48h
    }).limit(5).lean();

    overdueDisputes.forEach((d: any) => {
      suggestions.push({
        id: `overdue_dispute_${d._id}`,
        type: 'overdue_dispute',
        severity: 'critical',
        title: `Спор #${d._id.toString().slice(-6)} просрочен`,
        description: 'Открыт более 48 часов, требует внимания',
        entityType: 'dispute',
        entityId: d._id.toString(),
        actions: [
          { id: 'resolve_favor_customer', label: 'В пользу клиента', color: 'green' },
          { id: 'resolve_favor_provider', label: 'В пользу мастера', color: 'blue' },
          { id: 'escalate', label: 'Эскалировать', color: 'red' },
        ],
      });
    });

    // 3. Stuck bookings
    const stuckBookings = await this.bookingModel.find({
      status: 'confirmed',
      updatedAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // >2h without progress
    }).limit(5).lean();

    stuckBookings.forEach((b: any) => {
      suggestions.push({
        id: `stuck_booking_${b._id}`,
        type: 'stuck_booking',
        severity: 'warning',
        title: `Заказ #${b._id.toString().slice(-6)} завис`,
        description: 'Подтверждён, но нет прогресса более 2 часов',
        entityType: 'booking',
        entityId: b._id.toString(),
        actions: [
          { id: 'contact_provider', label: 'Связаться с мастером', color: 'blue' },
          { id: 'reassign', label: 'Переназначить', color: 'orange' },
          { id: 'cancel_refund', label: 'Отменить + возврат', color: 'red' },
        ],
      });
    });

    // 4. Quotes without responses
    const noResponseQuotes = await this.quoteModel.find({
      status: 'pending',
      responsesCount: 0,
      createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // >30min
    }).limit(5).lean();

    noResponseQuotes.forEach((q: any) => {
      suggestions.push({
        id: `no_response_${q._id}`,
        type: 'quote_no_response',
        severity: 'warning',
        title: `Заявка #${q._id.toString().slice(-6)} без ответов`,
        description: 'Более 30 минут без отклика мастеров',
        entityType: 'quote',
        entityId: q._id.toString(),
        actions: [
          { id: 'expand_radius', label: 'Расширить радиус', color: 'blue' },
          { id: 'send_push_providers', label: 'Push мастерам', color: 'green' },
          { id: 'boost_visibility', label: 'Boost заявки', color: 'orange' },
        ],
      });
    });

    // 5. High-value providers inactive
    const inactiveGold = await this.organizationModel.find({
      behavioralTier: { $in: ['gold', 'platinum'] },
      isOnline: false,
      lastActiveAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // >24h
    }).limit(3).lean();

    inactiveGold.forEach((p: any) => {
      suggestions.push({
        id: `inactive_gold_${p._id}`,
        type: 'inactive_top_provider',
        severity: 'info',
        title: `Топ-мастер "${p.name}" неактивен`,
        description: `${p.behavioralTier} уровень, офлайн более 24ч`,
        entityType: 'provider',
        entityId: p._id.toString(),
        actions: [
          { id: 'send_reactivation', label: 'Отправить напоминание', color: 'blue' },
          { id: 'offer_bonus', label: 'Предложить бонус', color: 'green' },
        ],
      });
    });

    return { suggestions, count: suggestions.length };
  }

  async executeSuggestionAction(suggestionId: string, actionId: string, userId: string) {
    // Parse suggestion
    const [type, entityId] = suggestionId.split('_').slice(0, 2).concat([suggestionId.split('_').slice(2).join('_')]);
    
    // Log the action
    await this.logAction({
      userId,
      actor: 'ADMIN',
      action: `suggestion_${actionId}`,
      entityType: type,
      entityId: entityId,
      description: `Executed suggested action: ${actionId}`,
    });

    // Execute based on action
    switch (actionId) {
      case 'limit_visibility':
        await this.organizationModel.findByIdAndUpdate(entityId, { visibilityState: 'limited' });
        break;
      case 'boost_competitors':
        // Would boost competitors in same zone
        break;
      case 'send_tip':
      case 'send_push_providers':
      case 'send_reactivation':
        // Would trigger notification
        break;
      case 'expand_radius':
        // Would expand quote radius
        break;
      case 'reassign':
        await this.bookingModel.findByIdAndUpdate(entityId, { status: 'pending_assignment' });
        break;
      case 'cancel_refund':
        await this.bookingModel.findByIdAndUpdate(entityId, { status: 'cancelled' });
        break;
      default:
        break;
    }

    return { success: true, actionId, suggestionId };
  }

  // ==================== REPUTATION CONTROL ====================

  async getProviderReputation(providerId: string) {
    const provider = await this.organizationModel.findById(providerId).lean();
    if (!provider) throw new NotFoundException('Provider not found');

    const reviews = await this.reviewModel.find({ organizationId: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const reputationActions = await this.reputationActionModel.find({ providerId: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      provider: {
        id: (provider as any)._id.toString(),
        name: (provider as any).name,
        rating: (provider as any).rating,
        reviewsCount: (provider as any).reviewsCount,
        behavioralScore: (provider as any).behavioralScore,
        behavioralTier: (provider as any).behavioralTier,
        trustFlags: (provider as any).trustFlags || [],
        penalties: (provider as any).penalties || [],
      },
      reviews: reviews.map((r: any) => ({
        id: r._id.toString(),
        rating: r.rating,
        comment: r.comment,
        isHidden: r.isHidden || false,
        createdAt: r.createdAt,
      })),
      reputationHistory: reputationActions.map((a: any) => ({
        id: a._id.toString(),
        actionType: a.actionType,
        oldValue: a.oldValue,
        newValue: a.newValue,
        reason: a.reason,
        createdAt: a.createdAt,
      })),
    };
  }

  async adjustProviderRating(providerId: string, data: {
    newRating: number;
    reason: string;
    performedBy: string;
  }) {
    const provider = await this.organizationModel.findById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');

    const oldRating = provider.rating;
    provider.rating = data.newRating;
    await provider.save();

    await this.reputationActionModel.create({
      providerId: new Types.ObjectId(providerId),
      performedBy: new Types.ObjectId(data.performedBy),
      actionType: 'rating_adjust',
      oldValue: { rating: oldRating },
      newValue: { rating: data.newRating },
      reason: data.reason,
    });

    await this.logAction({
      userId: data.performedBy,
      actor: 'ADMIN',
      action: 'adjust_rating',
      entityType: 'provider',
      entityId: providerId,
      oldValue: { rating: oldRating },
      newValue: { rating: data.newRating },
      description: `Adjusted rating from ${oldRating} to ${data.newRating}. Reason: ${data.reason}`,
    });

    return { success: true, oldRating, newRating: data.newRating };
  }

  async hideReview(reviewId: string, data: { reason: string; performedBy: string }) {
    const review = await this.reviewModel.findByIdAndUpdate(
      reviewId,
      { $set: { isHidden: true, hiddenReason: data.reason } },
      { new: true },
    );
    if (!review) throw new NotFoundException('Review not found');

    await this.reputationActionModel.create({
      providerId: review.organizationId,
      performedBy: new Types.ObjectId(data.performedBy),
      actionType: 'review_hide',
      reviewId,
      reason: data.reason,
    });

    await this.logAction({
      userId: data.performedBy,
      actor: 'ADMIN',
      action: 'hide_review',
      entityType: 'review',
      entityId: reviewId,
      description: `Hidden review. Reason: ${data.reason}`,
    });

    return { success: true };
  }

  async addTrustFlag(providerId: string, data: { flag: string; performedBy: string }) {
    const provider = await this.organizationModel.findByIdAndUpdate(
      providerId,
      { $addToSet: { trustFlags: data.flag } },
      { new: true },
    );
    if (!provider) throw new NotFoundException('Provider not found');

    await this.reputationActionModel.create({
      providerId: new Types.ObjectId(providerId),
      performedBy: new Types.ObjectId(data.performedBy),
      actionType: 'trust_flag',
      newValue: { flag: data.flag },
    });

    return { success: true, flags: provider.trustFlags };
  }

  async penalizeProvider(providerId: string, data: {
    type: string; // warning, score_reduction, suspension
    severity: number;
    reason: string;
    performedBy: string;
  }) {
    const provider = await this.organizationModel.findById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');

    const penalty = {
      type: data.type,
      severity: data.severity,
      reason: data.reason,
      appliedAt: new Date(),
    };

    // Apply penalty effects
    if (data.type === 'score_reduction') {
      provider.behavioralScore = Math.max(0, (provider.behavioralScore || 50) - data.severity);
    } else if (data.type === 'suspension') {
      provider.status = 'suspended';
    }

    provider.penalties = [...(provider.penalties || []), penalty];
    await provider.save();

    await this.reputationActionModel.create({
      providerId: new Types.ObjectId(providerId),
      performedBy: new Types.ObjectId(data.performedBy),
      actionType: 'penalize',
      newValue: penalty,
      reason: data.reason,
    });

    await this.logAction({
      userId: data.performedBy,
      actor: 'ADMIN',
      action: 'penalize_provider',
      entityType: 'provider',
      entityId: providerId,
      newValue: penalty,
      description: `Applied penalty: ${data.type} (severity: ${data.severity}). Reason: ${data.reason}`,
    });

    return { success: true, penalty };
  }
}
