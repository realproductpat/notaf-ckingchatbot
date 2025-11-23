*** Begin Patch
*** Update File: backend/src/routes/projects.ts
@@
   const meta = await prisma.fileMeta.create({
     data: {
       filename: file.originalname,
       path: file.filename,
       size: file.size,
       mime: file.mimetype,
       projectId
     }
   });
-  // enqueue ingestion (left as TODO: worker or background job)
+  // enqueue ingestion: trigger immediate processing (synchronous). In production, enqueue a background job instead.
+  try {
+    // lazy import to avoid circular deps on startup
+    const { processFileById } = await import("../ingest/processFile");
+    processFileById(meta.id).catch((e) => {
+      console.error("ingest error:", e);
+      // swallow: ingestion can be retried by worker/cron if desired
+    });
+  } catch (err) {
+    console.error("failed to kick off ingest:", err);
+  }
   res.json(meta);
 });
*** End Patch