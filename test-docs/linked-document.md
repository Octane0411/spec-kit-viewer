# Linked Document Example

This document demonstrates dependency linking between spec files.

## References

This document references the main [sample-spec.md](./sample-spec.md) for detailed information about the translation feature.

You can also check out the [[sample-spec]] using wiki-style linking.

## Additional Content

### Section A
This is some content that can be translated independently.

### Section B
This section contains technical details about the implementation.

The extension architecture follows standard VSCode patterns:
- Extension Host runs the main logic
- Webviews handle the UI components
- Message passing enables communication between them

### Section C
Testing different types of content to ensure translation works correctly across various markdown structures.

- List item 1
- List item 2
- List item 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

> This is a blockquote that should also be translated properly.

```javascript
// Code blocks should be preserved as-is
function example() {
    return "This code should not be translated";
}
```

**Bold text** and *italic text* should maintain their formatting in translation.