-- Create receipt sequence for atomic concurrency-safe allocation
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START WITH 1;

-- Align sequence with existing receipt numbers if any exist
DO $$
DECLARE
    max_receipt INTEGER;
BEGIN
    SELECT MAX(CAST(SUBSTRING(receipt FROM 3) AS INTEGER))
    INTO max_receipt
    FROM "Payment"
    WHERE receipt ~ '^R-[0-9]+$';

    IF max_receipt IS NOT NULL AND max_receipt > 0 THEN
        PERFORM setval('receipt_number_seq', max_receipt + 1, false);
    END IF;
END $$;
