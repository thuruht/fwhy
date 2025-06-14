#!/bin/bash

# Frontend Cleanup Script
# This script will move unused files to a backup directory for safety

echo "Creating backup directory..."
mkdir -p ./backup/unused-files

echo "Moving unused JavaScript files..."
mkdir -p ./backup/unused-files/jss

# Move unused JS files
mv ./jss/batch-upload-legacy.js ./backup/unused-files/jss/ 2>/dev/null || echo "batch-upload-legacy.js not found"
mv ./jss/batch-upload-old.js ./backup/unused-files/jss/ 2>/dev/null || echo "batch-upload-old.js not found"
mv ./jss/batch-upload.js ./backup/unused-files/jss/ 2>/dev/null || echo "batch-upload.js not found"
mv ./jss/script-broken.js ./backup/unused-files/jss/ 2>/dev/null || echo "script-broken.js not found"
mv "./jss/New Folder" ./backup/unused-files/jss/ 2>/dev/null || echo "New Folder not found"
mv ./jss/batch.htm ./backup/unused-files/jss/ 2>/dev/null || echo "jss/batch.htm not found"
mv ./jss/batchintegratestruct ./backup/unused-files/jss/ 2>/dev/null || echo "batchintegratestruct not found"
mv ./jss/ifrevoalds ./backup/unused-files/jss/ 2>/dev/null || echo "ifrevoalds not found"

echo "Moving backend worker files to separate directory..."
mkdir -p ./backend-workers
mv ./jss/blog-worker.js ./backend-workers/ 2>/dev/null || echo "blog-worker.js not found"
mv ./jss/current_gallery_worker.js ./backend-workers/ 2>/dev/null || echo "current_gallery_worker.js not found"
mv ./jss/eventswrkr.js ./backend-workers/ 2>/dev/null || echo "eventswrkr.js not found"
mv ./jss/unified-events-worker.js ./backend-workers/ 2>/dev/null || echo "unified-events-worker.js not found"

echo "Moving unused CSS files..."
mkdir -p ./backup/unused-files/css
mv ./css/3ccssss.css ./backup/unused-files/css/ 2>/dev/null || echo "3ccssss.css not found"
mv ./css/ccssss2.css ./backup/unused-files/css/ 2>/dev/null || echo "ccssss2.css not found"

echo "Moving empty HTML files..."
mv ./batch.htm ./backup/unused-files/ 2>/dev/null || echo "batch.htm not found"

echo "Handling duplicate font directories..."
echo "Both /fnt/ and /css/fnt/ contain the same fonts."
echo "Keeping /fnt/ and moving /css/fnt/ to backup"
mkdir -p ./backup/unused-files/css
mv ./css/fnt ./backup/unused-files/css/ 2>/dev/null || echo "css/fnt not found"

echo ""
echo "Cleanup complete!"
echo ""
echo "Summary of changes:"
echo "- Unused JS files moved to ./backup/unused-files/jss/"
echo "- Backend workers moved to ./backend-workers/"
echo "- Unused CSS files moved to ./backup/unused-files/css/"
echo "- Duplicate font directory moved to ./backup/unused-files/css/fnt/"
echo "- Empty files moved to ./backup/unused-files/"
echo ""
echo "Files have been moved (not deleted) for safety."
echo "You can restore any file if needed by copying it back from the backup directory."
echo ""
echo "Active frontend files remaining:"
echo "CSS: ./css/ccssss.css"
echo "JS: ./jss/script.js, ./jss/ifrevl.js, ./jss/ansik.js, ./jss/batch-upload-simplified.js"
echo "GSAP: ./jss/gsap-public/minified/"
echo "Fonts: ./fnt/"
echo "Newsletter: ./u/news.js, ./u/news.css"
