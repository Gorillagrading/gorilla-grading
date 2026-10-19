# COMPUTER VISION

## Goal

Create a vision-assisted grading pipeline that transforms card images into measurements/evidence for a grading workflow.

## Conceptual pipeline

Image capture
→ quality check
→ card detection
→ perspective correction
→ segmentation
→ centering
→ corners
→ edges
→ surface
→ OCR/identification
→ structured results
→ grading engine
→ human QA
→ certificate

## Useful technologies to evaluate

- OpenCV for image preprocessing and geometric analysis
- YOLO or similar object detection models
- Segmentation models
- OCR
- Vision-language models
- Embeddings for visual similarity

## Critical requirement

Never claim production-grade accuracy before validation.

## Dataset

Need representative images across:

- card brands/sets;
- languages;
- holo/refractor surfaces;
- lighting conditions;
- defects;
- legitimate variations;
- different grades.

## Metrics

- precision
- recall
- false positives
- false negatives
- inter-grader agreement
- calibration

## Product presentation

The user should see evidence, not just the phrase “AI graded”.
