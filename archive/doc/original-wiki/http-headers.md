### Request

| Header Field | Notes |
| ------------ | ----- |
| API-Version | Set this to a valid semver range to request a specific version or range of versions for the requested controller. |
| Update-Operator | Use this to perform updates (that **BYPASS VALIDATION**) using a special update operator such as `$set`, `$push`, or `$pull`.  The fields that may be updated must be whitelisted per controller.

### Response


| Header Field | Notes |
| ------------ | ----- |
| ETag | Used for HTTP caching based on response body.  Set automatically. |
| Last-Modified | Used for HTTP caching.  Set automatically. |
| Accept | Set to `application/json` for all responses. |
| Allow | Set automatically, correctly removing HTTP methods when those methods have been disabled. |
| Location | Set to the URL of the created entity for POST responses. |
| Link | Baucis adds related links to the header for you.  Especially useful for paging through a query.  `first`, `last`, `next`, and `previous` links are added when paging through a collection when using the `limit` & `skip` query options. |
