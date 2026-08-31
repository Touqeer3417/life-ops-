import base64
import binascii
import re
from dataclasses import dataclass
from email.message import Message
from html.parser import HTMLParser
from typing import Any


DEFAULT_MAX_BODY_CHARS = 100_000


@dataclass(
    frozen=True,
    slots=True,
)
class GmailParsedBody:
    text: str
    source_mime_type: str | None
    truncated: bool
    decode_failures: int


class _ReadableHTMLParser(HTMLParser):
    """
    Convert untrusted email HTML into plain readable text.

    No HTML is rendered or executed. Script/style-like content is
    discarded and only text nodes are retained.
    """

    _IGNORED_TAGS = frozenset(
        {
            "script",
            "style",
            "head",
            "svg",
            "canvas",
            "template",
            "noscript",
        }
    )

    _BLOCK_TAGS = frozenset(
        {
            "address",
            "article",
            "aside",
            "blockquote",
            "br",
            "div",
            "footer",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "header",
            "hr",
            "li",
            "main",
            "nav",
            "ol",
            "p",
            "pre",
            "section",
            "table",
            "tbody",
            "td",
            "tfoot",
            "th",
            "thead",
            "tr",
            "ul",
        }
    )

    def __init__(
        self,
    ) -> None:
        super().__init__(
            convert_charrefs=True
        )

        self._chunks: list[str] = []
        self._ignored_depth = 0

    def handle_starttag(
        self,
        tag: str,
        attrs: list[
            tuple[str, str | None]
        ],
    ) -> None:
        del attrs

        normalized = tag.lower()

        if normalized in self._IGNORED_TAGS:
            self._ignored_depth += 1
            return

        if (
            self._ignored_depth == 0
            and normalized in self._BLOCK_TAGS
        ):
            self._chunks.append("\n")

    def handle_startendtag(
        self,
        tag: str,
        attrs: list[
            tuple[str, str | None]
        ],
    ) -> None:
        self.handle_starttag(
            tag,
            attrs,
        )

        if tag.lower() in self._IGNORED_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(
        self,
        tag: str,
    ) -> None:
        normalized = tag.lower()

        if normalized in self._IGNORED_TAGS:
            if self._ignored_depth > 0:
                self._ignored_depth -= 1

            return

        if (
            self._ignored_depth == 0
            and normalized in self._BLOCK_TAGS
        ):
            self._chunks.append("\n")

    def handle_data(
        self,
        data: str,
    ) -> None:
        if (
            self._ignored_depth == 0
            and data
        ):
            self._chunks.append(data)

    def get_text(
        self,
    ) -> str:
        return _normalize_readable_text(
            "".join(self._chunks)
        )


def extract_gmail_body(
    payload: dict[str, Any] | None,
    *,
    max_chars: int = DEFAULT_MAX_BODY_CHARS,
) -> GmailParsedBody:
    """
    Extract readable body text from a Gmail Message.payload object.

    Rules:
    - recursively traverse nested multipart structures;
    - skip file/attachment parts;
    - prefer text/plain;
    - use sanitized HTML-to-text only when plain text is absent;
    - tolerate individual malformed base64/MIME parts;
    - never download attachmentId content.
    """

    if max_chars < 1:
        raise ValueError(
            "max_chars must be greater than zero"
        )

    if not isinstance(payload, dict):
        return GmailParsedBody(
            text="",
            source_mime_type=None,
            truncated=False,
            decode_failures=0,
        )

    plain_parts: list[str] = []
    html_parts: list[str] = []
    decode_failures = 0

    def walk(
        part: dict[str, Any],
    ) -> None:
        nonlocal decode_failures

        if _is_attachment(part):
            return

        mime_type = _normalized_mime_type(
            part.get("mimeType")
        )

        body = part.get("body")

        if isinstance(body, dict):
            data = body.get("data")

            if (
                isinstance(data, str)
                and data
                and mime_type
                in {
                    "text/plain",
                    "text/html",
                }
            ):
                try:
                    decoded = _decode_body_data(
                        data,
                        charset=_get_charset(
                            part
                        ),
                    )
                except (
                    binascii.Error,
                    UnicodeError,
                    ValueError,
                ):
                    decode_failures += 1
                else:
                    if mime_type == "text/plain":
                        normalized = (
                            _normalize_readable_text(
                                decoded
                            )
                        )

                        if normalized:
                            plain_parts.append(
                                normalized
                            )
                    else:
                        normalized_html = (
                            html_to_readable_text(
                                decoded
                            )
                        )

                        if normalized_html:
                            html_parts.append(
                                normalized_html
                            )

        raw_parts = part.get(
            "parts"
        )

        if isinstance(raw_parts, list):
            for child in raw_parts:
                if isinstance(child, dict):
                    walk(child)

    walk(payload)

    plain_text = _join_unique_parts(
        plain_parts
    )

    if plain_text:
        selected = plain_text
        source = "text/plain"
    else:
        selected = _join_unique_parts(
            html_parts
        )
        source = (
            "text/html"
            if selected
            else None
        )

    truncated = (
        len(selected) > max_chars
    )

    if truncated:
        selected = selected[
            :max_chars
        ].rstrip()

    return GmailParsedBody(
        text=selected,
        source_mime_type=source,
        truncated=truncated,
        decode_failures=decode_failures,
    )


def html_to_readable_text(
    html_content: str,
) -> str:
    """
    Extract text from untrusted email HTML.

    This function intentionally does not return sanitized HTML. Phase 4
    only needs text intelligence, so converting to plain text removes a
    large class of rendering/XSS concerns from downstream processing.
    """

    if not html_content:
        return ""

    parser = _ReadableHTMLParser()

    try:
        parser.feed(
            html_content
        )
        parser.close()
    except Exception:
        # Malformed marketing/newsletter HTML should not make an
        # otherwise-readable Gmail message unavailable.
        return _fallback_strip_html(
            html_content
        )

    return parser.get_text()


def decode_base64url(
    encoded: str,
) -> bytes:
    """
    Decode Gmail's URL-safe base64 representation.

    Gmail may omit trailing padding, so restore it before decoding.
    """

    normalized = encoded.strip()

    if not normalized:
        return b""

    padding = (
        "="
        * (-len(normalized) % 4)
    )

    return base64.b64decode(
        normalized + padding,
        altchars=b"-_",
        validate=True,
    )


def _decode_body_data(
    encoded: str,
    *,
    charset: str,
) -> str:
    raw = decode_base64url(
        encoded
    )

    if not raw:
        return ""

    try:
        return raw.decode(
            charset,
            errors="strict",
        )
    except LookupError:
        return raw.decode(
            "utf-8",
            errors="replace",
        )
    except UnicodeDecodeError:
        return raw.decode(
            charset,
            errors="replace",
        )


def _get_charset(
    part: dict[str, Any],
) -> str:
    content_type = _get_header(
        part,
        "content-type",
    )

    if not content_type:
        return "utf-8"

    message = Message()

    try:
        message[
            "content-type"
        ] = content_type

        return (
            message.get_content_charset()
            or "utf-8"
        )
    except Exception:
        return "utf-8"


def _get_header(
    part: dict[str, Any],
    header_name: str,
) -> str | None:
    headers = part.get(
        "headers"
    )

    if not isinstance(
        headers,
        list,
    ):
        return None

    expected = header_name.lower()

    for raw_header in headers:
        if not isinstance(
            raw_header,
            dict,
        ):
            continue

        name = raw_header.get(
            "name"
        )
        value = raw_header.get(
            "value"
        )

        if (
            isinstance(name, str)
            and name.lower() == expected
            and isinstance(value, str)
        ):
            return value

    return None


def _is_attachment(
    part: dict[str, Any],
) -> bool:
    filename = part.get(
        "filename"
    )

    if (
        isinstance(filename, str)
        and filename.strip()
    ):
        return True

    disposition = _get_header(
        part,
        "content-disposition",
    )

    if (
        disposition
        and disposition
        .lower()
        .lstrip()
        .startswith("attachment")
    ):
        return True

    body = part.get(
        "body"
    )

    if isinstance(body, dict):
        attachment_id = body.get(
            "attachmentId"
        )

        if (
            isinstance(attachment_id, str)
            and attachment_id.strip()
        ):
            return True

    return False


def _normalized_mime_type(
    value: object,
) -> str:
    if not isinstance(
        value,
        str,
    ):
        return ""

    return (
        value.strip()
        .lower()
        .split(
            ";",
            maxsplit=1,
        )[0]
    )


def _join_unique_parts(
    parts: list[str],
) -> str:
    seen: set[str] = set()
    unique: list[str] = []

    for part in parts:
        normalized = (
            part.strip()
        )

        if (
            not normalized
            or normalized in seen
        ):
            continue

        seen.add(
            normalized
        )
        unique.append(
            normalized
        )

    return "\n\n".join(
        unique
    )


def _normalize_readable_text(
    value: str,
) -> str:
    if not value:
        return ""

    normalized = (
        value.replace(
            "\r\n",
            "\n",
        )
        .replace(
            "\r",
            "\n",
        )
        .replace(
            "\xa0",
            " ",
        )
    )

    lines: list[str] = []

    for line in normalized.split(
        "\n"
    ):
        compact = re.sub(
            r"[ \t\f\v]+",
            " ",
            line,
        ).strip()

        lines.append(
            compact
        )

    output: list[str] = []
    previous_blank = False

    for line in lines:
        if not line:
            if (
                output
                and not previous_blank
            ):
                output.append("")

            previous_blank = True
            continue

        output.append(
            line
        )
        previous_blank = False

    return "\n".join(
        output
    ).strip()


def _fallback_strip_html(
    value: str,
) -> str:
    without_ignored_blocks = re.sub(
        r"(?is)<(script|style|head|svg|template|noscript)"
        r"\b[^>]*>.*?</\1\s*>",
        " ",
        value,
    )

    without_tags = re.sub(
        r"(?s)<[^>]+>",
        "\n",
        without_ignored_blocks,
    )

    return _normalize_readable_text(
        without_tags
    )