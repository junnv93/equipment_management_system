-- Migration: Rename contact_info → supplier_contact (UL-QP-18-02 용어 정합)
ALTER TABLE "equipment" RENAME COLUMN "contact_info" TO "supplier_contact";
