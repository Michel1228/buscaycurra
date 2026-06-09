export type UserPlan = "free" | "basico" | "esencial" | "pro" | "empresa";

export const PLAN_LIMITS: Record<UserPlan, { perDay: number; perMonth: number }> = {
  free:    { perDay: 2,        perMonth: 20        },
  basico:  { perDay: 5,        perMonth: 50        },
  esencial:{ perDay: 5,        perMonth: 60        },
  pro:     { perDay: 10,       perMonth: 200       },
  empresa: { perDay: Infinity, perMonth: Infinity  },
};
