import base64

from app.integrations.gmail_mime import (
    extract_gmail_body,
)


def _encode(
    value: str,
) -> str:
    return (
        base64.urlsafe_b64encode(
            value.encode(
                "utf-8"
            )
        )
        .decode(
            "ascii"
        )
        .rstrip(
            "="
        )
    )


def test_extracts_plain_text_from_simple_message() -> None:
    payload = {
        "mimeType": "text/plain",
        "headers": [
            {
                "name": "Content-Type",
                "value": (
                    "text/plain; "
                    "charset=UTF-8"
                ),
            }
        ],
        "body": {
            "data": _encode(
                "Your hosting plan "
                "renews tomorrow."
            )
        },
    }

    result = extract_gmail_body(
        payload
    )

    assert result.text == (
        "Your hosting plan "
        "renews tomorrow."
    )

    assert (
        result.source_mime_type
        == "text/plain"
    )

    assert result.truncated is False

    assert result.decode_failures == 0


def test_nested_multipart_prefers_plain_text_over_html() -> None:
    payload = {
        "mimeType": "multipart/mixed",
        "parts": [
            {
                "mimeType": (
                    "multipart/alternative"
                ),
                "parts": [
                    {
                        "mimeType": (
                            "text/html"
                        ),
                        "body": {
                            "data": _encode(
                                "<p>"
                                "HTML renewal notice"
                                "</p>"
                            )
                        },
                    },
                    {
                        "mimeType": (
                            "text/plain"
                        ),
                        "body": {
                            "data": _encode(
                                "Plain renewal notice"
                            )
                        },
                    },
                ],
            }
        ],
    }

    result = extract_gmail_body(
        payload
    )

    assert result.text == (
        "Plain renewal notice"
    )

    assert (
        result.source_mime_type
        == "text/plain"
    )


def test_html_is_converted_to_readable_text_when_plain_missing() -> None:
    payload = {
        "mimeType": "text/html",
        "body": {
            "data": _encode(
                """
                <html>
                    <head>
                        <style>
                            body { color: red; }
                        </style>
                        <script>
                            malicious();
                        </script>
                    </head>
                    <body>
                        <h1>Hostinger</h1>
                        <p>
                            Your hosting plan
                            <strong>renews</strong>
                            on September 15.
                        </p>
                        <br>
                        <p>Amount: $49.99</p>
                    </body>
                </html>
                """
            )
        },
    }

    result = extract_gmail_body(
        payload
    )

    assert "Hostinger" in result.text

    assert (
        "Your hosting plan"
        in result.text
    )

    assert "renews" in result.text

    assert "$49.99" in result.text

    assert "malicious" not in result.text

    assert "color: red" not in result.text

    assert (
        result.source_mime_type
        == "text/html"
    )


def test_attachment_parts_are_not_extracted() -> None:
    payload = {
        "mimeType": "multipart/mixed",
        "parts": [
            {
                "mimeType": "text/plain",
                "filename": "",
                "body": {
                    "data": _encode(
                        "Visible email body"
                    )
                },
            },
            {
                "mimeType": "text/plain",
                "filename": "secret.txt",
                "headers": [
                    {
                        "name": (
                            "Content-Disposition"
                        ),
                        "value": (
                            'attachment; '
                            'filename="secret.txt"'
                        ),
                    }
                ],
                "body": {
                    "attachmentId": (
                        "gmail-attachment-1"
                    ),
                    "data": _encode(
                        "ATTACHMENT CONTENT "
                        "MUST NOT BE EXTRACTED"
                    ),
                },
            },
        ],
    }

    result = extract_gmail_body(
        payload
    )

    assert result.text == (
        "Visible email body"
    )

    assert (
        "ATTACHMENT CONTENT"
        not in result.text
    )


def test_malformed_part_does_not_destroy_valid_sibling_text() -> None:
    payload = {
        "mimeType": (
            "multipart/alternative"
        ),
        "parts": [
            {
                "mimeType": "text/plain",
                "body": {
                    # Invalid base64url length.
                    "data": "a",
                },
            },
            {
                "mimeType": "text/html",
                "body": {
                    "data": _encode(
                        "<p>"
                        "Valid fallback body"
                        "</p>"
                    )
                },
            },
        ],
    }

    result = extract_gmail_body(
        payload
    )

    assert (
        "Valid fallback body"
        in result.text
    )

    assert result.decode_failures >= 1


def test_body_is_bounded_by_max_chars() -> None:
    payload = {
        "mimeType": "text/plain",
        "body": {
            "data": _encode(
                "A" * 500
            )
        },
    }

    result = extract_gmail_body(
        payload,
        max_chars=100,
    )

    assert len(
        result.text
    ) <= 100

    assert result.truncated is True


def test_empty_payload_returns_empty_safe_result() -> None:
    result = extract_gmail_body(
        {}
    )

    assert result.text == ""

    assert (
        result.source_mime_type
        is None
    )

    assert result.truncated is False