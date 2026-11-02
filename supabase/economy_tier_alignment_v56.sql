-- V56 clarification: two non-linear ETF branch skills have intentional editorial difficulty tiers
-- higher than simple parent-chain depth. The browser already uses these fixed tiers.
-- Align only their future unlock fees and completion awards; previous purchases stand.
UPDATE public.fp_specialization_catalog
SET cost_points = CASE id WHEN 'realrendite-kaufkraft' THEN 9 WHEN 'etf-tracking-steuern' THEN 11 END,
    completion_points = CASE id WHEN 'realrendite-kaufkraft' THEN 4 WHEN 'etf-tracking-steuern' THEN 5 END
WHERE id IN ('realrendite-kaufkraft','etf-tracking-steuern');