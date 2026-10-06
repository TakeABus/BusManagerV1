-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('INTO_THE_DUST', 'OUT_OF_THE_DUST');

-- CreateEnum
CREATE TYPE "TicketKind" AS ENUM ('ONE_WAY', 'ROUND_TRIP', 'RETURN_ONLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('PURCHASED', 'DIRECT_PAYMENT', 'COMP');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'LISTED_FOR_RESALE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ResaleStatus" AS ENUM ('LISTED', 'PENDING_PAYMENT', 'SOLD', 'WITHDRAWN', 'CLOSED');

-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BUS_60', 'VAN_12');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('VEHICLE', 'DEAD_LEG', 'PAYMENT_FEES', 'MARKETING', 'HOSTING', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketEventType" AS ENUM ('CREATED', 'PAID', 'NAME_CHANGED', 'DATE_CHANGED', 'RESALE_LISTED', 'RESALE_WITHDRAWN', 'RESOLD', 'COMP_GRANTED', 'HASH_REISSUED', 'CHECKED_IN', 'ADMIN_NOTE');

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "eventTheme" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "pickupLocationGps" TEXT,
    "ticketChangeCutoff" TIMESTAMP(3),
    "oneWayPriceCents" INTEGER,
    "roundTripPriceCents" INTEGER,
    "returnOnlyPriceCents" INTEGER,
    "salesOpensAt" TIMESTAMP(3),
    "resaleFloorPercent" INTEGER NOT NULL DEFAULT 50,
    "resaleFeePercent" INTEGER NOT NULL DEFAULT 8,
    "resaleCutoffHours" INTEGER NOT NULL DEFAULT 48,
    "paymentHoldMinutes" INTEGER NOT NULL DEFAULT 1440,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departure" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "supplierId" TEXT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "departsAt" TIMESTAMP(3) NOT NULL,
    "arrivesAt" TIMESTAMP(3),
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "restrictionNotes" TEXT,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'BUS_60',
    "vehicleCount" INTEGER NOT NULL DEFAULT 1,
    "seatCapacity" INTEGER NOT NULL,
    "status" "DepartureStatus" NOT NULL DEFAULT 'PLANNED',
    "conditional" BOOLEAN NOT NULL DEFAULT false,
    "minPassengers" INTEGER,
    "decideBy" TIMESTAMP(3),
    "isDeadLeg" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundTripOption" (
    "id" TEXT NOT NULL,
    "inboundId" TEXT NOT NULL,
    "outboundId" TEXT NOT NULL,

    CONSTRAINT "RoundTripOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "seasonId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "externalSource" TEXT,
    "externalRef" TEXT,
    "totalCents" INTEGER NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "playaName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "kind" "TicketKind" NOT NULL,
    "source" "TicketSource" NOT NULL DEFAULT 'PURCHASED',
    "sourceNote" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "priceCents" INTEGER NOT NULL,
    "holdExpiresAt" TIMESTAMP(3),
    "nameChangesUsed" INTEGER NOT NULL DEFAULT 0,
    "dateChangesUsed" INTEGER NOT NULL DEFAULT 0,
    "resold" BOOLEAN NOT NULL DEFAULT false,
    "qrHash" TEXT NOT NULL,
    "hashVersion" INTEGER NOT NULL DEFAULT 1,
    "ticketSent" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegBooking" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resale" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "listedPriceCents" INTEGER NOT NULL,
    "floorPriceCents" INTEGER NOT NULL,
    "feePercent" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "sellerNetCents" INTEGER NOT NULL,
    "status" "ResaleStatus" NOT NULL DEFAULT 'LISTED',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "buyerPaymentId" TEXT,

    CONSTRAINT "Resale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" "TicketEventType" NOT NULL,
    "actor" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "departureId" TEXT,
    "supplierId" TEXT,
    "category" "CostCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "incurredAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "donorEmail" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Departure_seasonId_code_key" ON "Departure"("seasonId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RoundTripOption_inboundId_outboundId_key" ON "RoundTripOption"("inboundId", "outboundId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalSource_externalRef_key" ON "Order"("externalSource", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrHash_key" ON "Ticket"("qrHash");

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");

-- CreateIndex
CREATE INDEX "Ticket_holderId_idx" ON "Ticket"("holderId");

-- CreateIndex
CREATE INDEX "LegBooking_departureId_idx" ON "LegBooking"("departureId");

-- CreateIndex
CREATE UNIQUE INDEX "LegBooking_ticketId_departureId_key" ON "LegBooking"("ticketId", "departureId");

-- CreateIndex
CREATE UNIQUE INDEX "Resale_buyerPaymentId_key" ON "Resale"("buyerPaymentId");

-- CreateIndex
CREATE INDEX "Resale_ticketId_idx" ON "Resale"("ticketId");

-- CreateIndex
CREATE INDEX "Resale_status_idx" ON "Resale"("status");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_eventId_key" ON "PaymentEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "TicketEvent_ticketId_idx" ON "TicketEvent"("ticketId");

-- CreateIndex
CREATE INDEX "CostItem_seasonId_idx" ON "CostItem"("seasonId");

-- CreateIndex
CREATE INDEX "CostItem_departureId_idx" ON "CostItem"("departureId");

-- AddForeignKey
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTripOption" ADD CONSTRAINT "RoundTripOption_inboundId_fkey" FOREIGN KEY ("inboundId") REFERENCES "Departure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTripOption" ADD CONSTRAINT "RoundTripOption_outboundId_fkey" FOREIGN KEY ("outboundId") REFERENCES "Departure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegBooking" ADD CONSTRAINT "LegBooking_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegBooking" ADD CONSTRAINT "LegBooking_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Departure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resale" ADD CONSTRAINT "Resale_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resale" ADD CONSTRAINT "Resale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resale" ADD CONSTRAINT "Resale_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Passenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resale" ADD CONSTRAINT "Resale_buyerPaymentId_fkey" FOREIGN KEY ("buyerPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Departure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
