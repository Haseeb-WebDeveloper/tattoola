-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ARTIST', 'TATTOO_LOVER');

-- CreateEnum
CREATE TYPE "AdminLevel" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'ADMIN_ASSIGNED');

-- CreateEnum
CREATE TYPE "StudioRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'FILE', 'SYSTEM', 'INTAKE_QUESTION', 'INTAKE_ANSWER');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'REJECTED', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('ARTIST', 'LOVER');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'LIKE', 'COMMENT', 'MESSAGE', 'CONNECTION_REQUEST', 'SUBSCRIPTION_EXPIRY', 'STUDIO_INVITATION', 'SYSTEM', 'REPORT_RECEIVED', 'REPORT_REVIEWED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('USER', 'CONVERSATION', 'POST', 'COMMENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('STUDIO_OWNER', 'STUDIO_EMPLOYEE', 'FREELANCE');

-- CreateEnum
CREATE TYPE "ArtistType" AS ENUM ('FREELANCE', 'STUDIO_EMPLOYEE', 'STUDIO_OWNER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PREMIUM', 'STUDIO');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('FOUR_IMAGES', 'ONE_IMAGE', 'ONE_VIDEO');

-- CreateEnum
CREATE TYPE "StudioMemberStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionEventType" AS ENUM ('CREATED', 'RENEWED', 'CANCELLED', 'EXPIRED', 'UPDATED', 'TRIAL_STARTED', 'TRIAL_ENDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'TATTOO_LOVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "portfolioComplete" BOOLEAN NOT NULL DEFAULT false,
    "yearsExperience" INTEGER,
    "specialties" TEXT[],
    "businessName" TEXT,
    "studioAddress" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "workArrangement" "WorkArrangement",
    "artistType" "ArtistType",
    "isStudioOwner" BOOLEAN NOT NULL DEFAULT false,
    "minimumPrice" DOUBLE PRECISION,
    "hourlyRate" DOUBLE PRECISION,
    "mainStyleId" TEXT,
    "acceptPrivateRequests" BOOLEAN NOT NULL DEFAULT true,
    "rejectionMessage" TEXT,
    "bannerType" "BannerType" DEFAULT 'FOUR_IMAGES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "AdminLevel" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "monthlyPrice" DOUBLE PRECISION,
    "yearlyPrice" DOUBLE PRECISION,
    "maxPosts" INTEGER,
    "maxCollections" INTEGER,
    "maxStudioMembers" INTEGER,
    "canCreateStudio" BOOLEAN NOT NULL DEFAULT true,
    "canUploadVideos" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "PlanType" NOT NULL DEFAULT 'PREMIUM',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "freeTrialDays" INTEGER,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isAdminAssigned" BOOLEAN NOT NULL DEFAULT false,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isTrial" BOOLEAN NOT NULL DEFAULT true,
    "adminNotes" TEXT,
    "assignedBy" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL,
    "bannerType" "BannerType" DEFAULT 'FOUR_IMAGES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "studios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_members" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "role" "StudioRole" NOT NULL DEFAULT 'MEMBER',
    "status" "StudioMemberStatus" NOT NULL DEFAULT 'PENDING',
    "invitationToken" TEXT,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "invitedBy" TEXT,

    CONSTRAINT "studio_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_photos" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_styles" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "studioId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_services" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "studioId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_faqs" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_banner_media" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "studioId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "bannerType" "BannerType" NOT NULL DEFAULT 'FOUR_IMAGES',
    "mediaUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_banner_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "caption" TEXT,
    "thumbnailUrl" TEXT,
    "styleId" TEXT,
    "projectId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "showInFeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazines" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "coverImage" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "styleId" TEXT,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magazines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazine_likes" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magazine_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazine_comments" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magazine_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazine_views" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magazine_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isPortfolioCollection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_posts" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_requests" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "artistId" TEXT,
    "loverId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_users" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "role" "ConversationRole" NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "canSend" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conversation_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "replyToMessageId" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "intakeFieldKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'DELIVERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "message_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_intakes" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "schemaVersion" TEXT,
    "questions" JSONB,
    "answers" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_styles" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_favorite_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_favorite_styles" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "artistId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "artist_favorite_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_parts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_body_parts" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "artistId" TEXT NOT NULL,
    "bodyPartId" TEXT NOT NULL,

    CONSTRAINT "artist_body_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_projects" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_project_media" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "projectId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_project_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_project_styles" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "projectId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,

    CONSTRAINT "portfolio_project_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Italy',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "postalCode" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tattoo_styles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tattoo_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "styleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_services" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "artistId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_banner_media" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "artistId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "bannerType" "BannerType" NOT NULL DEFAULT 'FOUR_IMAGES',
    "mediaUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_banner_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "postId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "receiverId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "conversationId" TEXT,
    "reportType" "ReportType" NOT NULL DEFAULT 'USER',
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "address" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_locations" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "address" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "companyName" TEXT,
    "taxId" TEXT,
    "vatId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountSubtotal" INTEGER NOT NULL,
    "amountTax" INTEGER NOT NULL DEFAULT 0,
    "amountDiscount" INTEGER NOT NULL DEFAULT 0,
    "amountTotal" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT_METHOD',
    "provider" TEXT NOT NULL,
    "providerChargeId" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "SubscriptionEventType" NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "artist_profiles_userId_key" ON "artist_profiles"("userId");

-- CreateIndex
CREATE INDEX "artist_profiles_userId_idx" ON "artist_profiles"("userId");

-- CreateIndex
CREATE INDEX "artist_profiles_portfolioComplete_idx" ON "artist_profiles"("portfolioComplete");

-- CreateIndex
CREATE INDEX "artist_profiles_workArrangement_idx" ON "artist_profiles"("workArrangement");

-- CreateIndex
CREATE INDEX "artist_profiles_artistType_idx" ON "artist_profiles"("artistType");

-- CreateIndex
CREATE INDEX "artist_profiles_mainStyleId_idx" ON "artist_profiles"("mainStyleId");

-- CreateIndex
CREATE INDEX "artist_profiles_yearsExperience_idx" ON "artist_profiles"("yearsExperience");

-- CreateIndex
CREATE INDEX "artist_profiles_minimumPrice_idx" ON "artist_profiles"("minimumPrice");

-- CreateIndex
CREATE INDEX "artist_profiles_hourlyRate_idx" ON "artist_profiles"("hourlyRate");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE INDEX "admin_profiles_userId_idx" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_type_key" ON "subscription_plans"("type");

-- CreateIndex
CREATE INDEX "subscription_plans_name_idx" ON "subscription_plans"("name");

-- CreateIndex
CREATE INDEX "subscription_plans_type_idx" ON "subscription_plans"("type");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_idx" ON "subscription_plans"("isActive");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_subscriptions_endDate_idx" ON "user_subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "user_subscriptions_isAdminAssigned_idx" ON "user_subscriptions"("isAdminAssigned");

-- CreateIndex
CREATE INDEX "user_subscriptions_isFree_idx" ON "user_subscriptions"("isFree");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_status_idx" ON "user_subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_endDate_idx" ON "user_subscriptions"("userId", "endDate");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_endDate_idx" ON "user_subscriptions"("status", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "studios_slug_key" ON "studios"("slug");

-- CreateIndex
CREATE INDEX "studios_ownerId_idx" ON "studios"("ownerId");

-- CreateIndex
CREATE INDEX "studios_slug_idx" ON "studios"("slug");

-- CreateIndex
CREATE INDEX "studios_isActive_idx" ON "studios"("isActive");

-- CreateIndex
CREATE INDEX "studios_isCompleted_idx" ON "studios"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "studio_members_invitationToken_key" ON "studio_members"("invitationToken");

-- CreateIndex
CREATE INDEX "studio_members_studioId_idx" ON "studio_members"("studioId");

-- CreateIndex
CREATE INDEX "studio_members_userId_idx" ON "studio_members"("userId");

-- CreateIndex
CREATE INDEX "studio_members_status_idx" ON "studio_members"("status");

-- CreateIndex
CREATE INDEX "studio_members_invitationToken_idx" ON "studio_members"("invitationToken");

-- CreateIndex
CREATE INDEX "studio_members_invitedBy_idx" ON "studio_members"("invitedBy");

-- CreateIndex
CREATE UNIQUE INDEX "studio_members_studioId_userId_key" ON "studio_members"("studioId", "userId");

-- CreateIndex
CREATE INDEX "studio_photos_studioId_idx" ON "studio_photos"("studioId");

-- CreateIndex
CREATE INDEX "studio_styles_studioId_idx" ON "studio_styles"("studioId");

-- CreateIndex
CREATE INDEX "studio_styles_styleId_idx" ON "studio_styles"("styleId");

-- CreateIndex
CREATE INDEX "studio_styles_studioId_styleId_idx" ON "studio_styles"("studioId", "styleId");

-- CreateIndex
CREATE UNIQUE INDEX "studio_styles_studioId_styleId_key" ON "studio_styles"("studioId", "styleId");

-- CreateIndex
CREATE INDEX "studio_services_studioId_idx" ON "studio_services"("studioId");

-- CreateIndex
CREATE INDEX "studio_services_serviceId_idx" ON "studio_services"("serviceId");

-- CreateIndex
CREATE INDEX "studio_services_studioId_serviceId_idx" ON "studio_services"("studioId", "serviceId");

-- CreateIndex
CREATE INDEX "studio_services_studioId_isActive_idx" ON "studio_services"("studioId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "studio_services_studioId_serviceId_key" ON "studio_services"("studioId", "serviceId");

-- CreateIndex
CREATE INDEX "studio_faqs_studioId_idx" ON "studio_faqs"("studioId");

-- CreateIndex
CREATE INDEX "studio_faqs_order_idx" ON "studio_faqs"("order");

-- CreateIndex
CREATE INDEX "studio_banner_media_studioId_idx" ON "studio_banner_media"("studioId");

-- CreateIndex
CREATE INDEX "studio_banner_media_order_idx" ON "studio_banner_media"("order");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_styleId_idx" ON "posts"("styleId");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt");

-- CreateIndex
CREATE INDEX "posts_likesCount_idx" ON "posts"("likesCount");

-- CreateIndex
CREATE INDEX "magazines_authorId_idx" ON "magazines"("authorId");

-- CreateIndex
CREATE INDEX "magazines_styleId_idx" ON "magazines"("styleId");

-- CreateIndex
CREATE INDEX "magazines_isPublished_idx" ON "magazines"("isPublished");

-- CreateIndex
CREATE INDEX "magazines_isFeatured_idx" ON "magazines"("isFeatured");

-- CreateIndex
CREATE INDEX "magazines_publishedAt_idx" ON "magazines"("publishedAt");

-- CreateIndex
CREATE INDEX "magazines_viewsCount_idx" ON "magazines"("viewsCount");

-- CreateIndex
CREATE INDEX "magazines_likesCount_idx" ON "magazines"("likesCount");

-- CreateIndex
CREATE INDEX "magazine_likes_magazineId_idx" ON "magazine_likes"("magazineId");

-- CreateIndex
CREATE INDEX "magazine_likes_userId_idx" ON "magazine_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "magazine_likes_magazineId_userId_key" ON "magazine_likes"("magazineId", "userId");

-- CreateIndex
CREATE INDEX "magazine_comments_magazineId_idx" ON "magazine_comments"("magazineId");

-- CreateIndex
CREATE INDEX "magazine_comments_authorId_idx" ON "magazine_comments"("authorId");

-- CreateIndex
CREATE INDEX "magazine_comments_parentId_idx" ON "magazine_comments"("parentId");

-- CreateIndex
CREATE INDEX "magazine_views_magazineId_idx" ON "magazine_views"("magazineId");

-- CreateIndex
CREATE INDEX "magazine_views_userId_idx" ON "magazine_views"("userId");

-- CreateIndex
CREATE INDEX "magazine_views_createdAt_idx" ON "magazine_views"("createdAt");

-- CreateIndex
CREATE INDEX "post_likes_postId_idx" ON "post_likes"("postId");

-- CreateIndex
CREATE INDEX "post_likes_userId_idx" ON "post_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON "post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "collections_ownerId_idx" ON "collections"("ownerId");

-- CreateIndex
CREATE INDEX "collections_isPrivate_idx" ON "collections"("isPrivate");

-- CreateIndex
CREATE INDEX "collections_isPortfolioCollection_idx" ON "collections"("isPortfolioCollection");

-- CreateIndex
CREATE INDEX "collection_posts_collectionId_idx" ON "collection_posts"("collectionId");

-- CreateIndex
CREATE INDEX "collection_posts_postId_idx" ON "collection_posts"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_posts_collectionId_postId_key" ON "collection_posts"("collectionId", "postId");

-- CreateIndex
CREATE INDEX "private_requests_senderId_idx" ON "private_requests"("senderId");

-- CreateIndex
CREATE INDEX "private_requests_receiverId_idx" ON "private_requests"("receiverId");

-- CreateIndex
CREATE INDEX "private_requests_status_idx" ON "private_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "private_requests_senderId_receiverId_key" ON "private_requests"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_artistId_loverId_key" ON "conversations"("artistId", "loverId");

-- CreateIndex
CREATE INDEX "conversation_users_conversationId_idx" ON "conversation_users"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_users_userId_idx" ON "conversation_users"("userId");

-- CreateIndex
CREATE INDEX "conversation_users_deletedAt_idx" ON "conversation_users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_users_conversationId_userId_key" ON "conversation_users"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "message_receipts_userId_idx" ON "message_receipts"("userId");

-- CreateIndex
CREATE INDEX "message_receipts_status_idx" ON "message_receipts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "message_receipts_messageId_userId_key" ON "message_receipts"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_intakes_conversationId_key" ON "conversation_intakes"("conversationId");

-- CreateIndex
CREATE INDEX "user_favorite_styles_userId_idx" ON "user_favorite_styles"("userId");

-- CreateIndex
CREATE INDEX "user_favorite_styles_styleId_idx" ON "user_favorite_styles"("styleId");

-- CreateIndex
CREATE INDEX "user_favorite_styles_userId_styleId_idx" ON "user_favorite_styles"("userId", "styleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_styles_userId_styleId_key" ON "user_favorite_styles"("userId", "styleId");

-- CreateIndex
CREATE INDEX "artist_favorite_styles_artistId_idx" ON "artist_favorite_styles"("artistId");

-- CreateIndex
CREATE INDEX "artist_favorite_styles_styleId_idx" ON "artist_favorite_styles"("styleId");

-- CreateIndex
CREATE INDEX "artist_favorite_styles_artistId_styleId_idx" ON "artist_favorite_styles"("artistId", "styleId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_favorite_styles_artistId_styleId_key" ON "artist_favorite_styles"("artistId", "styleId");

-- CreateIndex
CREATE UNIQUE INDEX "body_parts_name_key" ON "body_parts"("name");

-- CreateIndex
CREATE INDEX "body_parts_name_idx" ON "body_parts"("name");

-- CreateIndex
CREATE INDEX "body_parts_isActive_idx" ON "body_parts"("isActive");

-- CreateIndex
CREATE INDEX "artist_body_parts_artistId_idx" ON "artist_body_parts"("artistId");

-- CreateIndex
CREATE INDEX "artist_body_parts_bodyPartId_idx" ON "artist_body_parts"("bodyPartId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_body_parts_artistId_bodyPartId_key" ON "artist_body_parts"("artistId", "bodyPartId");

-- CreateIndex
CREATE INDEX "portfolio_projects_artistId_idx" ON "portfolio_projects"("artistId");

-- CreateIndex
CREATE INDEX "portfolio_projects_order_idx" ON "portfolio_projects"("order");

-- CreateIndex
CREATE INDEX "portfolio_project_media_projectId_idx" ON "portfolio_project_media"("projectId");

-- CreateIndex
CREATE INDEX "portfolio_project_media_order_idx" ON "portfolio_project_media"("order");

-- CreateIndex
CREATE INDEX "portfolio_project_styles_projectId_idx" ON "portfolio_project_styles"("projectId");

-- CreateIndex
CREATE INDEX "portfolio_project_styles_styleId_idx" ON "portfolio_project_styles"("styleId");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_project_styles_projectId_styleId_key" ON "portfolio_project_styles"("projectId", "styleId");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE INDEX "provinces_name_idx" ON "provinces"("name");

-- CreateIndex
CREATE INDEX "provinces_code_idx" ON "provinces"("code");

-- CreateIndex
CREATE INDEX "municipalities_name_idx" ON "municipalities"("name");

-- CreateIndex
CREATE INDEX "municipalities_provinceId_idx" ON "municipalities"("provinceId");

-- CreateIndex
CREATE INDEX "municipalities_postalCode_idx" ON "municipalities"("postalCode");

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_styles_name_key" ON "tattoo_styles"("name");

-- CreateIndex
CREATE INDEX "tattoo_styles_name_idx" ON "tattoo_styles"("name");

-- CreateIndex
CREATE INDEX "tattoo_styles_isActive_idx" ON "tattoo_styles"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "services_styleId_idx" ON "services"("styleId");

-- CreateIndex
CREATE INDEX "services_isActive_idx" ON "services"("isActive");

-- CreateIndex
CREATE INDEX "artist_services_artistId_idx" ON "artist_services"("artistId");

-- CreateIndex
CREATE INDEX "artist_services_serviceId_idx" ON "artist_services"("serviceId");

-- CreateIndex
CREATE INDEX "artist_services_artistId_serviceId_idx" ON "artist_services"("artistId", "serviceId");

-- CreateIndex
CREATE INDEX "artist_services_artistId_isActive_idx" ON "artist_services"("artistId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "artist_services_artistId_serviceId_key" ON "artist_services"("artistId", "serviceId");

-- CreateIndex
CREATE INDEX "artist_banner_media_artistId_idx" ON "artist_banner_media"("artistId");

-- CreateIndex
CREATE INDEX "artist_banner_media_order_idx" ON "artist_banner_media"("order");

-- CreateIndex
CREATE INDEX "post_media_postId_idx" ON "post_media"("postId");

-- CreateIndex
CREATE INDEX "post_media_order_idx" ON "post_media"("order");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "notifications_receiverId_idx" ON "notifications"("receiverId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_reportedUserId_idx" ON "reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "blocked_users_blockerId_idx" ON "blocked_users"("blockerId");

-- CreateIndex
CREATE INDEX "blocked_users_blockedId_idx" ON "blocked_users"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_users_blockerId_blockedId_key" ON "blocked_users"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "user_locations_userId_idx" ON "user_locations"("userId");

-- CreateIndex
CREATE INDEX "user_locations_provinceId_idx" ON "user_locations"("provinceId");

-- CreateIndex
CREATE INDEX "user_locations_municipalityId_idx" ON "user_locations"("municipalityId");

-- CreateIndex
CREATE INDEX "user_locations_isPrimary_idx" ON "user_locations"("isPrimary");

-- CreateIndex
CREATE INDEX "user_locations_userId_provinceId_idx" ON "user_locations"("userId", "provinceId");

-- CreateIndex
CREATE INDEX "studio_locations_studioId_idx" ON "studio_locations"("studioId");

-- CreateIndex
CREATE INDEX "studio_locations_provinceId_idx" ON "studio_locations"("provinceId");

-- CreateIndex
CREATE INDEX "studio_locations_municipalityId_idx" ON "studio_locations"("municipalityId");

-- CreateIndex
CREATE INDEX "studio_locations_isPrimary_idx" ON "studio_locations"("isPrimary");

-- CreateIndex
CREATE INDEX "studio_locations_studioId_provinceId_idx" ON "studio_locations"("studioId", "provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_profiles_userId_key" ON "billing_profiles"("userId");

-- CreateIndex
CREATE INDEX "billing_profiles_userId_idx" ON "billing_profiles"("userId");

-- CreateIndex
CREATE INDEX "payment_methods_userId_idx" ON "payment_methods"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_provider_providerRef_key" ON "payment_methods"("provider", "providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_items_planId_idx" ON "invoice_items"("planId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "subscription_events_subscriptionId_idx" ON "subscription_events"("subscriptionId");

-- AddForeignKey
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_mainStyleId_fkey" FOREIGN KEY ("mainStyleId") REFERENCES "tattoo_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studios" ADD CONSTRAINT "studios_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_members" ADD CONSTRAINT "studio_members_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_members" ADD CONSTRAINT "studio_members_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_members" ADD CONSTRAINT "studio_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_members" ADD CONSTRAINT "studio_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_photos" ADD CONSTRAINT "studio_photos_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_styles" ADD CONSTRAINT "studio_styles_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_styles" ADD CONSTRAINT "studio_styles_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_services" ADD CONSTRAINT "studio_services_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_services" ADD CONSTRAINT "studio_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_faqs" ADD CONSTRAINT "studio_faqs_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_banner_media" ADD CONSTRAINT "studio_banner_media_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazines" ADD CONSTRAINT "magazines_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazines" ADD CONSTRAINT "magazines_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_likes" ADD CONSTRAINT "magazine_likes_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "magazines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_likes" ADD CONSTRAINT "magazine_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_comments" ADD CONSTRAINT "magazine_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_comments" ADD CONSTRAINT "magazine_comments_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "magazines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_comments" ADD CONSTRAINT "magazine_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "magazine_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_views" ADD CONSTRAINT "magazine_views_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "magazines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_views" ADD CONSTRAINT "magazine_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_posts" ADD CONSTRAINT "collection_posts_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_posts" ADD CONSTRAINT "collection_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_requests" ADD CONSTRAINT "private_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_requests" ADD CONSTRAINT "private_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_loverId_fkey" FOREIGN KEY ("loverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_users" ADD CONSTRAINT "conversation_users_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_users" ADD CONSTRAINT "conversation_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_intakes" ADD CONSTRAINT "conversation_intakes_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_intakes" ADD CONSTRAINT "conversation_intakes_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_styles" ADD CONSTRAINT "user_favorite_styles_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_styles" ADD CONSTRAINT "user_favorite_styles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_favorite_styles" ADD CONSTRAINT "artist_favorite_styles_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_favorite_styles" ADD CONSTRAINT "artist_favorite_styles_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_body_parts" ADD CONSTRAINT "artist_body_parts_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_body_parts" ADD CONSTRAINT "artist_body_parts_bodyPartId_fkey" FOREIGN KEY ("bodyPartId") REFERENCES "body_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_project_media" ADD CONSTRAINT "portfolio_project_media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_project_styles" ADD CONSTRAINT "portfolio_project_styles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_project_styles" ADD CONSTRAINT "portfolio_project_styles_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "tattoo_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_services" ADD CONSTRAINT "artist_services_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_services" ADD CONSTRAINT "artist_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_banner_media" ADD CONSTRAINT "artist_banner_media_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_locations" ADD CONSTRAINT "studio_locations_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_locations" ADD CONSTRAINT "studio_locations_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_locations" ADD CONSTRAINT "studio_locations_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_profiles" ADD CONSTRAINT "billing_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

