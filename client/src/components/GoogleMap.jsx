import { memo } from "react"

const sanitizeEmbeddedMap = (embeddedMap) => {
    if (!embeddedMap) return embeddedMap;

    return embeddedMap.replace(/<iframe([^>]*)>/i, (match, attrs) => {
        let cleanedAttrs = attrs
            .replace(/\s*width="[^"]*"/gi, "")
            .replace(/\s*height="[^"]*"/gi, "");

        if (/style="[^"]*"/i.test(cleanedAttrs)) {
            cleanedAttrs = cleanedAttrs.replace(/style="([^"]*)"/i, (_match, style) => {
                return `style="${style};width:100% !important;height:100% !important;min-height:260px;max-height:60vh;"`;
            });
        } else {
            cleanedAttrs += ' style="width:100% !important;height:100% !important;min-height:260px;max-height:60vh;"';
        }

        return `<iframe${cleanedAttrs}>`;
    });
};

export const GameMap = memo(({ embeddedMap }) => {
    return (
        <div style={{ width: "100%", maxWidth: "100%", aspectRatio: "16/9", minHeight: "240px", overflow: "hidden" }}>
            <div
                style={{ width: "100%", height: "100%" }}
                dangerouslySetInnerHTML={{ __html: sanitizeEmbeddedMap(embeddedMap) }}
            />
        </div>
    );
});