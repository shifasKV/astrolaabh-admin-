import type { Order } from "@/lib/types";

export const MOCK_ORDERS: Order[] = [
  {
    id: "AL-ORD-001", customerId: "cust_001", customerName: "Radhika Oberoi",
    items: [{ sku: "AL-PKJ-0417", name: "Pukhraj · Ceylon Yellow Sapphire", qty: 1, price: 285000, gemstone: "Yellow Sapphire", caratWeight: "5.2r", itemType: "stone", itemStatus: "ready_to_ship" }],
    total: 285000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed", paymentStatus: "paid",
    energisationStatus: "completed", energisationTier: "pran_pratishtha", certificateStatus: "verified", affiliateCode: "SANDEEP108", tracking: "AWB-BLU-5518234",
    placedAt: "2026-02-10", updatedAt: "2026-03-05", placedBy: "ops@astrolaabh.house", consultationId: "cons_001", recommendationId: "rec_001",
  },
  {
    id: "AL-ORD-002", customerId: "cust_002", customerName: "Amit Khanna",
    items: [{ sku: "AL-MNK-0208", name: "Manik · Burmese Ruby", qty: 1, price: 412000, gemstone: "Ruby", caratWeight: "3.8r", itemType: "stone", itemStatus: "ready_to_ship" }],
    total: 412000, stage: 6, shopifyStatus: "partially_fulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "completed", energisationTier: "maha_abhishek", certificateStatus: "uploaded", tracking: "AWB-DHL-7742901",
    placedAt: "2026-04-18", updatedAt: "2026-07-25", placedBy: "ops@astrolaabh.house", consultationId: "cons_002", recommendationId: "rec_002",
  },
  {
    id: "AL-ORD-003", customerId: "cust_003", customerName: "Zara Sheikh",
    items: [{ sku: "AL-PNA-0312", name: "Panna · Colombian Emerald", qty: 1, price: 198000, gemstone: "Emerald", caratWeight: "4.1r", itemType: "stone", itemStatus: "order_received" }],
    total: 198000, stage: 2, shopifyStatus: "unfulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "in_progress", energisationTier: "shuddhi", certificateStatus: "missing", affiliateCode: "MEENA9",
    placedAt: "2026-06-01", updatedAt: "2026-07-30", consultationId: "cons_003", recommendationId: "rec_003",
  },
  {
    id: "AL-ORD-004", customerId: "cust_004", customerName: "Rajesh Iyer",
    items: [
      { sku: "AL-NLM-0156", name: "Neelam · Sri Lankan Blue Sapphire", qty: 1, price: 520000, gemstone: "Blue Sapphire", caratWeight: "6.4r", itemType: "stone", itemStatus: "order_received" },
      { sku: "DSN-VDYA-03", name: "Vidya Pendant · 18K Gold", qty: 1, price: 38000, itemType: "jewellery", itemStatus: "order_placed" },
    ],
    total: 558000, stage: 1, shopifyStatus: "unfulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "scheduled", energisationTier: "vishesh_anushthan", certificateStatus: "missing", affiliateCode: "SANDEEP108",
    placedAt: "2026-07-10", updatedAt: "2026-08-02", placedBy: "ops@astrolaabh.house", consultationId: "cons_004", recommendationId: "rec_004",
  },
  {
    id: "AL-ORD-005", customerId: "cust_005", customerName: "Kavya Menon",
    items: [{ sku: "AL-HRA-0102", name: "Heera · GIA Certified Diamond", qty: 1, price: 875000, gemstone: "Diamond", caratWeight: "1.8ct", itemType: "stone", itemStatus: "order_placed" }],
    total: 875000, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending", paymentStatus: "pending",
    energisationStatus: "pending", energisationTier: "pran_pratishtha", certificateStatus: "not_required",
    placedAt: "2026-08-01", updatedAt: "2026-08-01", consultationId: "cons_005", recommendationId: "rec_005",
  },
  {
    id: "AL-ORD-006", customerId: "cust_006", customerName: "Vikram Singh Randhawa",
    items: [
      { sku: "AL-MNK-0301", name: "Manik · Mozambique Ruby", qty: 1, price: 178000, gemstone: "Ruby", caratWeight: "2.9r", itemType: "stone", itemStatus: "order_received" },
      { sku: "DSN-AKSH-01", name: "Akshaya Ring · 22K Gold", qty: 1, price: 45000, itemType: "jewellery", itemStatus: "in_crafting" },
    ],
    total: 223000, stage: 3, shopifyStatus: "unfulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "completed", energisationTier: "shuddhi", certificateStatus: "verified", affiliateCode: "VTRI21",
    placedAt: "2026-05-20", updatedAt: "2026-07-28",
  },
  {
    id: "AL-ORD-007", customerId: "cust_009", customerName: "Meera Patel",
    items: [
      { sku: "AL-PKJ-0610", name: "Pukhraj · Thai Yellow Sapphire", qty: 1, price: 165000, gemstone: "Yellow Sapphire", caratWeight: "3.5r", itemType: "stone", itemStatus: "quality_check" },
      { sku: "DSN-SHRN-02", name: "Sharan Ring · 22K Gold", qty: 1, price: 52000, itemType: "jewellery", itemStatus: "quality_check" },
    ],
    total: 217000, stage: 4, shopifyStatus: "unfulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "scheduled", energisationTier: "maha_abhishek", certificateStatus: "uploaded", affiliateCode: "SANDEEP108",
    placedAt: "2026-06-15", updatedAt: "2026-08-03", consultationId: "cons_009", recommendationId: "rec_006",
  },
  {
    id: "AL-ORD-008", customerId: "cust_010", customerName: "Arjun Nair",
    items: [{ sku: "AL-NLM-0089", name: "Neelam · Kashmiri Blue Sapphire", qty: 1, price: 890000, gemstone: "Blue Sapphire", caratWeight: "8.1r", itemType: "stone", itemStatus: "ready_to_ship" }],
    total: 890000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed", paymentStatus: "paid",
    energisationStatus: "completed", energisationTier: "vishesh_anushthan", certificateStatus: "verified", tracking: "AWB-DTDC-9921847",
    placedAt: "2026-04-02", updatedAt: "2026-08-05",
  },
  {
    id: "AL-ORD-009", customerId: "cust_008", customerName: "Siddharth Joshi",
    items: [{ sku: "AL-PNA-0445", name: "Panna · Zambian Emerald", qty: 1, price: 142000, gemstone: "Emerald", caratWeight: "3.2r", itemType: "stone", itemStatus: "ready_to_ship" }],
    total: 142000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed", paymentStatus: "paid",
    energisationStatus: "completed", energisationTier: "pran_pratishtha", certificateStatus: "verified", tracking: "AWB-EKT-1127563",
    placedAt: "2026-03-20", updatedAt: "2026-05-12", returnStatus: "settled",
  },
  {
    id: "AL-ORD-010", customerId: "cust_011", customerName: "Divya Kapoor",
    items: [
      { sku: "AL-MNG-0142", name: "Moonga · Italian Red Coral", qty: 1, price: 95000, gemstone: "Coral", caratWeight: "6.5r", itemType: "stone", itemStatus: "order_received" },
      { sku: "DSN-LKSM-05", name: "Lakshmi Bracelet · 18K Rose Gold", qty: 1, price: 62000, itemType: "jewellery", itemStatus: "order_received" },
    ],
    total: 157000, stage: 1, shopifyStatus: "unfulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "scheduled", energisationTier: "maha_abhishek", certificateStatus: "missing", affiliateCode: "MEENA9",
    placedAt: "2026-07-28", updatedAt: "2026-08-04",
  },
  {
    id: "AL-ORD-011", customerId: "cust_007", customerName: "Ananya Reddy",
    items: [{ sku: "AL-GMD-0078", name: "Gomed · Ceylon Hessonite", qty: 1, price: 126000, gemstone: "Hessonite", caratWeight: "7.2r", itemType: "stone", itemStatus: "order_placed" }],
    total: 126000, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending", paymentStatus: "pending",
    energisationStatus: "pending", energisationTier: "shuddhi", certificateStatus: "not_required",
    placedAt: "2026-08-04", updatedAt: "2026-08-04",
  },
  {
    id: "AL-ORD-012", customerId: "cust_012", customerName: "Rohan Malhotra",
    items: [
      { sku: "AL-LSN-0033", name: "Lehsunia · Chrysoberyl Cat's Eye", qty: 1, price: 245000, gemstone: "Cat's Eye", caratWeight: "5.1r", itemType: "stone", itemStatus: "order_placed" },
      { sku: "AL-MTI-0091", name: "Moti · Basra Pearl", qty: 1, price: 12760, gemstone: "Pearl", caratWeight: "4.2r", itemType: "stone", itemStatus: "order_placed" },
    ],
    total: 257760, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending", paymentStatus: "pending",
    energisationStatus: "pending", energisationTier: "maha_abhishek", certificateStatus: "not_required", affiliateCode: "RAJENDRA7",
    placedAt: "2026-08-06", updatedAt: "2026-08-06", placedBy: "admin@astrolaabh.house", consultationId: "cons_008",
  },
  {
    id: "AL-ORD-013", customerId: "cust_006", customerName: "Vikram Singh Randhawa",
    items: [{ sku: "AL-MTI-0155", name: "Moti · South Sea Pearl", qty: 1, price: 82000, gemstone: "Pearl", caratWeight: "5.8r", itemType: "stone", itemStatus: "in_transit" }],
    total: 82000, stage: 5, shopifyStatus: "partially_fulfilled", operationalStatus: "in_progress", paymentStatus: "paid",
    energisationStatus: "completed", energisationTier: "shuddhi", certificateStatus: "uploaded", affiliateCode: "VTRI21", tracking: "AWB-BLU-6619023",
    placedAt: "2026-06-25", updatedAt: "2026-08-07",
  },
];
