const mongoose = require('mongoose');
const { Schema } = mongoose;

// 1. Achievements
const achievementSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  startDate: { type: Date, default: Date.now },
  targetDate: Date,
  dateAchieved: Date,
  dateFailed: Date,
  notes: String
}, { timestamps: true });

// 2. Rules + daily checks
const ruleSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const ruleCheckSchema = new Schema({
  rule: { type: Schema.Types.ObjectId, ref: 'Rule', required: true },
  date: { type: String, required: true }, // store as YYYY-MM-DD for easy lookup
  followed: { type: Boolean, default: false },
  comment: String
});
ruleCheckSchema.index({ rule: 1, date: 1 }, { unique: true });

// 3. Career
const careerSchema = new Schema({
  task: { type: String, required: true },
  description: String,
  targetDate: Date,
  dateAchieved: Date,
  status: { type: String, enum: ['pending', 'in-progress', 'achieved', 'missed'], default: 'pending' }
}, { timestamps: true });

// 4. Daily Routine (hourly tasks) + checks per day
const routineSlotSchema = new Schema({
  hour: { type: String, required: true }, // e.g. "06:00"
  task: { type: String, required: true }
});

const routineCheckSchema = new Schema({
  slot: { type: Schema.Types.ObjectId, ref: 'RoutineSlot', required: true },
  date: { type: String, required: true },
  done: { type: Boolean, default: false }
});
routineCheckSchema.index({ slot: 1, date: 1 }, { unique: true });

// 5. Theme of the Year
const themeOfYearSchema = new Schema({
  year: { type: Number, required: true, unique: true },
  theme: { type: String, required: true },
  description: String
});

// 6. Habit Stopper + daily check
const habitStopperSchema = new Schema({
  title: { type: String, required: true },
  targetDays: { type: Number, required: true },
  startDate: { type: Date, default: Date.now }
});

const habitCheckSchema = new Schema({
  habit: { type: Schema.Types.ObjectId, ref: 'HabitStopper', required: true },
  date: { type: String, required: true },
  succeeded: { type: Boolean, default: false }, // true = stayed clean that day
  comment: String
});
habitCheckSchema.index({ habit: 1, date: 1 }, { unique: true });

// Extra: Daily Journal (bonus feature)
const journalSchema = new Schema({
  date: { type: String, required: true, unique: true },
  entry: String,
  mood: { type: String, enum: ['great', 'good', 'okay', 'bad', 'terrible'] }
});

module.exports = {
  Achievement: mongoose.model('Achievement', achievementSchema),
  Rule: mongoose.model('Rule', ruleSchema),
  RuleCheck: mongoose.model('RuleCheck', ruleCheckSchema),
  Career: mongoose.model('Career', careerSchema),
  RoutineSlot: mongoose.model('RoutineSlot', routineSlotSchema),
  RoutineCheck: mongoose.model('RoutineCheck', routineCheckSchema),
  ThemeOfYear: mongoose.model('ThemeOfYear', themeOfYearSchema),
  HabitStopper: mongoose.model('HabitStopper', habitStopperSchema),
  HabitCheck: mongoose.model('HabitCheck', habitCheckSchema),
  Journal: mongoose.model('Journal', journalSchema)
};