## HTTP Status Codes :traffic_light:

Baucis supports a rich array of error responses and status codes. For more information on status codes see [RFC2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html) the HTTP sepcification.

### 4xx

4xx status codes mean that the client, for example a web browser made a mistake and needs to fix the response.

#### 400 Bad Request

The client made a bad request and should fix the request before trying again.  This is also sent when a deprecated command is used.

    baucis.Error.BadRequest
    baucis.Error.BadSyntax
    baucis.Error.Deprecated

#### 403 Forbidden

Sent when the requested action is disallowed for a controller.

    baucis.Error.Forbidden;

#### 404 Not Found

Sent when the query does not match any document, or when the requested resource does not exist.

    baucis.Error.NotFound

#### 405 Method Not Allowed

The request HTTP method (i.e one of `HEAD`, `GET`, `POST`, `PUT`, `DELETE`) is disabled for this resource.  This can be done by e.g. `controller.methods('post put delete', false)`.

    baucis.Error.MethodNotAllowed

#### 406 Not Acceptable

The `Accept` header specified in the request could not be fulfilled.  By default JSON is supported.  Baucis is pluggable to allow adding formatters for additional content types.

    baucis.Error.NotAcceptable

#### 409 Conflict

If a controller has optimistic locking enabled, baucis will automatically check each updated document's version and give a 409 error if another API client modified the document before the requester was able to send their update.

In this case, a client could reload the document, present the user with a description of the conflict, and ask them how to procede.

    baucis.Error.LockConflict

#### 415 Unspported Media Type

The request body content type was not able to be parsed.  By default JSON is supported.  Baucis is pluggable to allow adding parsers for additional content types.

    baucis.Error.UnsupportedMediaType

#### 422 Unprocessable Entity

This status indicates the request body was syntactically correct and could be parsed, but that it is not semantically correct, and so it could not be processed.  Most often countered when a document's validation step fails.

    baucis.Error.UnprocessableEntity

Baucis will send a response body with error 422 that indicates what validation failed for which fields.
``` json
{
  "name": {
  "message": "Path `name` is required.",
  "name": "ValidatorError",
  "path": "name",
      "type": "required"
  },
  "score": {
  "message": "Path `score` (-1) is less than minimum allowed value (1).",
  "name": "ValidatorError",
  "path": "score",
  "type": "min",
      "value": -1
  }
}
```

Technically, this error is from [RFC4918](https://tools.ietf.org/html/rfc4918#section-11.2), the WebDAV specification.


### 5xx

Where as `4xx` errors mean the requester messed up, `5xx` errors mean the server messed up :)

#### 500 Internal Server Error

This means that baucis is misconfigured, or that the server tried to perform the requested action but failed.

    baucis.Error.Misconfigured

#### 501 Not Implemented

The requested functionality is not implemented now, but may be implented in the future.

    baucis.Error.NotImplemented
