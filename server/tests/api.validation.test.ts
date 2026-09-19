import { test, describe } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';

const scanAnalyzeSchema = z
  .object({
    image: z
      .string()
      .max(25 * 1024 * 1024)
      .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/)
      .optional(),
    preset_id: z.string().min(1).max(100).optional(),
    weight_kg: z.number().min(0.1).max(10000).optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        label: z.string().max(200).optional(),
      })
      .optional(),
    material_hint: z.string().max(100).optional(),
  })
  .refine((data) => data.image || data.preset_id, {
    message: 'Either image or preset_id must be provided.',
    path: ['image'],
  });

describe('API Input Validation Schema Tests', () => {
  test('should accept valid preset scan request', () => {
    const valid = scanAnalyzeSchema.safeParse({
      preset_id: 'preset-pet-bottles',
      weight_kg: 12.5,
      location: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
    });
    assert.strictEqual(valid.success, true);
  });

  test('should accept valid base64 image request', () => {
    const valid = scanAnalyzeSchema.safeParse({
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAPAAAA==',
      weight_kg: 5.0,
    });
    assert.strictEqual(valid.success, true);
  });

  test('should reject request missing both image and preset_id', () => {
    const invalid = scanAnalyzeSchema.safeParse({
      weight_kg: 10.0,
    });
    assert.strictEqual(invalid.success, false);
  });

  test('should reject invalid non-image URI strings', () => {
    const invalid = scanAnalyzeSchema.safeParse({
      image: 'data:text/html;base64,PHNjcmlwdD4=',
    });
    assert.strictEqual(invalid.success, false);
  });

  test('should reject negative or out-of-range weights', () => {
    const invalid = scanAnalyzeSchema.safeParse({
      preset_id: 'preset-pet-bottles',
      weight_kg: -10.0,
    });
    assert.strictEqual(invalid.success, false);
  });
});
