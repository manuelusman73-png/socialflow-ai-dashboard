# Export API Documentation

## Overview

The Export API provides memory-efficient streaming endpoints for exporting large datasets as CSV or JSON Lines (NDJSON) formats. The API uses cursor-based pagination to handle datasets of any size without memory exhaustion.

## Endpoints

### GET /api/exports/analytics

Stream analytics data for a date range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organizationId | string | Yes | Organization ID to export data for |
| format | string | Yes | Export format: `csv` or `json` |
| startDate | string | Yes | Start date (ISO 8601 format) |
| endDate | string | Yes | End date (ISO 8601 format) |

**Response Headers:**

- `Content-Type`: `text/csv; charset=utf-8` or `application/x-ndjson; charset=utf-8`
- `Content-Disposition`: `attachment; filename="analytics.csv"` or `attachment; filename="analytics.jsonl"`

**CSV Format:**

```
id,organizationId,platform,metric,value,recordedAt
<id>,<org-id>,<platform>,<metric>,<value>,<timestamp>
```

**JSON Lines Format:**

```json
{"id":"<id>","organizationId":"<org-id>","platform":"<platform>","metric":"<metric>","value":<value>,"recordedAt":"<timestamp>"}
```

**Example Requests:**

```bash
# CSV export
curl "http://localhost:3000/api/exports/analytics?organizationId=org-123&format=csv&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o analytics.csv

# JSON Lines export
curl "http://localhost:3000/api/exports/analytics?organizationId=org-123&format=json&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o analytics.jsonl
```

**Error Responses:**

```json
// Missing required parameter
{
  "error": "organizationId is required"
}

// Invalid format
{
  "error": "format must be \"csv\" or \"json\""
}

// Invalid date format
{
  "error": "Invalid date format"
}

// Server error
{
  "error": "Export failed"
}
```

---

### GET /api/exports/posts

Stream posts data for a date range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organizationId | string | Yes | Organization ID to export data for |
| format | string | Yes | Export format: `csv` or `json` |
| startDate | string | Yes | Start date (ISO 8601 format) |
| endDate | string | Yes | End date (ISO 8601 format) |

**Response Headers:**

- `Content-Type`: `text/csv; charset=utf-8` or `application/x-ndjson; charset=utf-8`
- `Content-Disposition`: `attachment; filename="posts.csv"` or `attachment; filename="posts.jsonl"`

**CSV Format:**

```
id,organizationId,content,platform,scheduledAt,createdAt
<id>,<org-id>,<content>,<platform>,<scheduled>,<created>
```

**JSON Lines Format:**

```json
{"id":"<id>","organizationId":"<org-id>","content":"<content>","platform":"<platform>","scheduledAt":"<scheduled>","createdAt":"<created>"}
```

**Example Requests:**

```bash
# CSV export
curl "http://localhost:3000/api/exports/posts?organizationId=org-123&format=csv&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o posts.csv

# JSON Lines export
curl "http://localhost:3000/api/exports/posts?organizationId=org-123&format=json&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z" \
  -o posts.jsonl
```

---

## Implementation Details

### Streaming Architecture

The API uses Node.js streams to implement zero-buffering data flow:

1. **Database Query**: Fetch batch of records using cursor-based pagination
2. **Stream Processing**: Convert records to CSV/JSON format
3. **HTTP Response**: Pipe stream directly to HTTP response
4. **Progressive Download**: Client receives data as it's generated

### Cursor-Based Pagination

- **Batch Size**: 1000 records per query
- **Cursor**: Uses record ID to continue pagination
- **Ordering**: Consistent ordering by ID
- **Memory**: O(BATCH_SIZE) regardless of total dataset size

### CSV Escaping

- Double quotes are escaped: `"` → `""`
- Fields with special characters are quoted
- Proper handling of newlines and commas

### Error Handling

- Parameter validation on all required fields
- Date format validation (ISO 8601)
- Stream error handling with graceful degradation
- HTTP 500 response on server errors

---

## Usage Examples

### Node.js - Save to File

```typescript
import https from 'https';
import fs from 'fs';

const url = 'http://localhost:3000/api/exports/analytics?organizationId=org-123&format=csv&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z';
const file = fs.createWriteStream('analytics.csv');

https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Export complete');
  });
});
```

### Node.js - Process Stream Line-by-Line

```typescript
import https from 'https';

const url = 'http://localhost:3000/api/exports/analytics?organizationId=org-123&format=json&startDate=2025-09-25T00:00:00Z&endDate=2026-03-25T23:59:59Z';
let buffer = '';

https.get(url, (response) => {
  response.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');

    // Process complete lines
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].trim()) {
        const record = JSON.parse(lines[i]);
        console.log('Record:', record);
      }
    }

    // Keep incomplete line in buffer
    buffer = lines[lines.length - 1];
  });

  response.on('end', () => {
    if (buffer.trim()) {
      const record = JSON.parse(buffer);
      console.log('Record:', record);
    }
  });
});
```

### Browser - Download File

```javascript
const url = new URL('http://localhost:3000/api/exports/analytics');
url.searchParams.append('organizationId', 'org-123');
url.searchParams.append('format', 'csv');
url.searchParams.append('startDate', '2025-09-25T00:00:00Z');
url.searchParams.append('endDate', '2026-03-25T23:59:59Z');

// Create download link
const link = document.createElement('a');
link.href = url.toString();
link.download = 'analytics.csv';
link.click();
```

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Memory Usage | O(BATCH_SIZE) = ~1MB per batch |
| DB Query Time | ~50-100ms per 1000 records |
| Network Throughput | Progressive (client receives data as generated) |
| Scalability | Supports datasets of any size |
| Max Records | Unlimited (cursor-based pagination) |

---

## Best Practices

1. **Use JSON Lines for Large Datasets**: NDJSON format allows incremental parsing
2. **Stream Processing**: Process records as they arrive rather than buffering
3. **Error Handling**: Implement retry logic for network failures
4. **Date Ranges**: Use reasonable date ranges to avoid excessive query times
5. **Monitoring**: Track export duration and file sizes

---

## Troubleshooting

### Export Fails with "organizationId is required"

Ensure the `organizationId` query parameter is provided and is a valid string.

### Export Fails with "Invalid date format"

Dates must be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

Examples:
- `2025-09-25T00:00:00Z`
- `2026-03-25T23:59:59Z`

### Export is Slow

- Check database indexes on `organizationId`, `recordedAt`, and `id`
- Consider reducing the date range
- Monitor database query performance

### File is Incomplete

- Check network connection stability
- Verify server logs for errors
- Retry the export

---

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Support filtering by platform
- [ ] Add gzip compression
- [ ] Implement rate limiting
- [ ] Add progress tracking
- [ ] Support additional formats (Parquet, Excel)
- [ ] Add batch size configuration
