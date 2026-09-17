import { z } from "zod";

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  map: z.object({
    defaultZoom: z.number(),
    minZoom: z.number(),
    maxZoom: z.number(),
  }),
  description: z.string(),
  contact: z.object({
    phone: z.string(),
    email: z.string(),
  }),
});

export type Project = z.infer<typeof projectSchema>;
