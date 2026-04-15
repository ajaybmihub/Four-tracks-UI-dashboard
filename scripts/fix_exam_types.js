const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

// Question schema
const questionSchema = new mongoose.Schema({
  department: String,
  exam_type: String,
  subject: String,
  topic: String,
  subtopic: String,
  difficulty: String,
  question: String,
  option: {
    A: String,
    B: String,
    C: String,
    D: String,
    E: String
  },
  answer: String,
  explanation: String,
  level: String,
  eligibility: String,
  year: String,
  pdf_name: String
});

// Exam type mappings for RBI/Dev Banks
const examTypeMappings = {
  'ippb_rbi_linked': {
    from: 'IBPS RRB Office Assistant (Clerk)',
    to: 'IPPB / Regional Rural Bank (RBI-linked) Recruitment'
  },
  'rbi_assistant': {
    from: 'IBPS RRB Office Assistant (Clerk)',
    to: 'RBI Assistant'
  },
  'nabard_grade_a': {
    from: 'IBPS RRB Office Assistant (Clerk)',
    to: 'NABARD Grade A'
  },
  'nabard_grade_b': {
    from: 'IBPS RRB Office Assistant (Clerk)',
    to: 'NABARD Grade B'
  },
  'sidbi_grade_a': {
    from: 'IBPS RRB Office Assistant (Clerk)',
    to: 'SIDBI Grade A'
  },
  'exim_bank_recruitment': {
    from: 'IBPS RRB Office Assistant (Clerk)',
    to: 'EXIM Bank Recruitment'
  }
};

async function fixExamTypes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const [collectionName, mapping] of Object.entries(examTypeMappings)) {
      console.log(`\n🔄 Processing collection: ${collectionName}`);
      
      // Get the model for this collection
      const Model = mongoose.model(collectionName, questionSchema, collectionName);
      
      // Update all documents in this collection
      const result = await Model.updateMany(
        { exam_type: mapping.from },
        { $set: { exam_type: mapping.to } }
      );
      
      console.log(`📝 Updated ${result.modifiedCount} documents in ${collectionName}`);
      console.log(`   Changed: "${mapping.from}" → "${mapping.to}"`);
    }

    console.log('\n✅ All exam types have been updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating exam types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixExamTypes();
