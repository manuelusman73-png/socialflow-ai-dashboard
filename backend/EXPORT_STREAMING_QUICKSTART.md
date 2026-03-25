# API Response Streaming for Large Data Exports

## Overview

The ExportService implements memory-efficient streaming for large dataset exports using Node.js streams and cursor-based pagination. This prevents memory exhaustion when exporting 6+ months of analytics data.

## Architecture

### Key Components

1. **ExportService** (`src/services/ExportService.ts`)
   - Cursor-based pagination with 1000-record batches
   - Zero-buffering approach: data flows directly from DB to HTTP response
   - Supports CSV and JSON Lines (NDJSON) formats
   - Methods for analytics and posts exports

2. **Export Routes** (`src/routes/exports.ts`)
   - `/api/exports/analytics` - Stream analytics data
   - `/api/exports/posts` - Stream posts data
   - Query parameters: `organizationId`, `format`, `startDate`, `endDate`

## Usage

### Export Analytics as CSV

```bash
curl "http://localhost:3000/api/exports/analytics?organizationId=org-123&format=csv&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o analytics.csv
```

### Export Analytics as JSON Lines

```bash
curl "http://localhost:3000/api/exports/analytics?organizationId=org-123&format=json&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o analytics.jsonl
```

### Export Posts as CSV

```bash
curl "http://localhost:3000/api/exports/posts?organizationId=org-123&format=csv&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o posts.csv
```

## Implementation Details

### Cursor-Based Pagination

The service uses Prisma's cursor-based pagination to fetch data in batches:

```typescript
const batch = await prisma.analyticsEntry.findMany({
  where: { organizationId, recordedAt: { gte: startDate, lte: endDate } },
  take: BATCH_SIZE + 1,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { id: 'asc' },
});
```

- **BATCH_SIZE**: 1000 records per query
- **Cursor**: Uses the last record's ID to continue pagination
- **Skip**: Skips the cursor record to avoid duplicates

### Zero-Buffering Streaming

Data flows directly from database to HTTP response:

1. Create a Readable stream
2. Fetch batch from DB
3. Push rows to stream immediately
4. Pipe stream to HTTP response
5. No intermediate buffering

### CSV Format

- Proper escaping of quotes in content fields
- Headers: `id,organizationId,platform,metric,value,recordedAt`
- Content-Type: `text/csv; charset=utf-8`

### JSON Lines Format

- One JSON object per line (NDJSON)
- Content-Type: `application/x-ndjson; charset=utf-8`
- Easier to parse incrementally on the client

## Performance Characteristics

- **Memory**: O(BATCH_SIZE) - only one batch in memory at a time
- **Database**: Indexed queries on `organizationId`, `recordedAt`, and `id`
- **Network**: Progressive download - client receives data as it's generated
- **Throughput**: ~1000 records per DB query

## Error Handling

- Validates required query parameters
- Validates date format (ISO 8601)
- Catches DB errors and destroys stream
- Returns 500 error if headers already sent

## Future Enhancements

- Add authentication/authorization middleware
- Support filtering by platform
- Add compression (gzip)
- Implement rate limiting
- Add progress tracking via headers
