-- FinanzPilot V75: repair legacy reward-ledger constraints, deployed 2026-11-03.
-- The original table only allowed XP = 20 and FP = 1.
-- Its server award function (economy_balance_v56.sql) now uses stage XP
-- 8,10,12,14,16,18 and FP 0/1. This mismatch prevented new awards.
-- Keep existing historical 20-XP rewards without deductions.
alter table public.fp_foundation_rewards_v55
  drop constraint fp_foundation_rewards_v55_xp_check,
  add constraint fp_foundation_rewards_v55_xp_check
    check (xp in (8,10,12,14,16,18,20)),
  drop constraint fp_foundation_rewards_v55_fp_check,
  add constraint fp_foundation_rewards_v55_fp_check
    check (fp in (0,1));
