import { queryOptions } from "@tanstack/react-query";

import { getScoutReport } from "@/lib/scout.functions";
import { reportLookupSchema } from "@/lib/scout.schemas";

export const reportQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["report", id],
    // A malformed link is simply "not found", never a server error.
    queryFn: () => (reportLookupSchema.safeParse({ id }).success ? getScoutReport({ data: { id } }) : Promise.resolve(null)),
  });

export const money = (value: number) => `$${Math.round(value).toLocaleString()}`;
