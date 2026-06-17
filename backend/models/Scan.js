const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['xray', 'symptoms'], required: true },
    input: { type: mongoose.Schema.Types.Mixed },
    label: String,
    confidence: Number,
    classes: [String],
    heatmapBase64: String,
    entities: [String],
    possibleConditions: [String],
    emergency: {
      isEmergency: Boolean,
      triggers: [String],
      message: String,
    },
    geminiExplanation: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Computed summary for quick display
scanSchema.virtual('summary').get(function () {
  if (this.kind === 'xray') {
    return `X-ray: ${this.label || 'Unknown'} (${Math.round((this.confidence || 0) * 100)}%)`;
  }
  return `Symptoms: ${this.possibleConditions?.slice(0, 2).join(', ') || 'Unknown'}`;
});

module.exports = mongoose.model('Scan', scanSchema);
