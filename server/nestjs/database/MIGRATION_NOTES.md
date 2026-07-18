# Database migration notes

`003-bourmet-catalog.sql` adds the fields required by the public website:

- `products.is_best_seller`
- `products.display_order`
- `categories.theme`
- `categories.display_order`

The migration is not executed automatically.

## Preflight result

The database contained development records with duplicate slugs:

- product slug `myprod`
- category slug `cat-99`

The records were removed after creating a private backup. Migration
`003-bourmet-catalog.sql` was then applied successfully and both slug columns
now have unique constraints.

## Category themes

The website expects one of these values in `categories.theme`:

- `burgers`
- `sides`
- `desserts`
- `drinks`

Only categories with a theme are rendered as primary accordion sections in the
public menu. This prevents dietary and promotional categories from duplicating
products in the page layout.

## Public catalog expansion

`004-expand-public-catalog.sql` adds the original sides, salads and desserts,
plus the standard drinks selection. It also resets and assigns the initial
eight best sellers: five burgers, two fried products and one dessert.

## Safe execution

1. Create a fresh database backup.
2. Remove or rename duplicate development records.
3. Execute `003-bourmet-catalog.sql`.
4. Verify the new columns and indexes.
5. Add the unique slug constraints.
