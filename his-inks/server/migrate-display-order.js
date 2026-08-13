/**
 * Migration script to populate displayOrder fields for existing records
 * 
 * This script assigns sequential displayOrder values to:
 * 1. Inspirations (based on current createdAt order)
 * 2. Tattoos (based on current createdAt order)
 * 
 * Run with: node migrate-display-order.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Inspiration = require('./src/modules/inspiration/inspiration.model');
const Tattoo = require('./src/modules/tattoos/tattoo.model');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/his-inks');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

async function migrateInspirations() {
  console.log('\n📝 Migrating Inspirations...');
  
  try {
    // Get all inspirations ordered by current sorting (createdAt: -1, newest first)
    const inspirations = await Inspiration.find({}).sort({ createdAt: -1 }).select('_id title createdAt displayOrder');
    
    console.log(`Found ${inspirations.length} inspirations`);
    
    if (inspirations.length === 0) {
      console.log('No inspirations to migrate');
      return;
    }

    // Check if any already have non-zero displayOrder
    const alreadyOrdered = inspirations.filter(i => i.displayOrder && i.displayOrder > 0);
    if (alreadyOrdered.length > 0) {
      console.log(`⚠️  Warning: ${alreadyOrdered.length} inspirations already have displayOrder values`);
      console.log('Existing ordered items:', alreadyOrdered.map(i => `${i.title} (order: ${i.displayOrder})`));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Continue and overwrite existing order? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Migration cancelled by user');
        return;
      }
    }

    // Assign sequential displayOrder starting from 1
    let updateCount = 0;
    for (let i = 0; i < inspirations.length; i++) {
      const inspiration = inspirations[i];
      const newOrder = i + 1; // 1-based indexing
      
      await Inspiration.findByIdAndUpdate(
        inspiration._id, 
        { displayOrder: newOrder },
        { runValidators: false } // Skip validation for migration
      );
      
      console.log(`  ${newOrder}. ${inspiration.title} (created: ${inspiration.createdAt.toISOString().split('T')[0]})`);
      updateCount++;
    }
    
    console.log(`✅ Updated ${updateCount} inspirations with displayOrder`);
  } catch (error) {
    console.error('❌ Error migrating inspirations:', error.message);
    throw error;
  }
}

async function migrateTattoos() {
  console.log('\n📝 Migrating Tattoos...');
  
  try {
    // Get all tattoos ordered by current sorting (createdAt: -1, newest first)
    const tattoos = await Tattoo.find({}).sort({ createdAt: -1 }).select('_id title createdAt displayOrder');
    
    console.log(`Found ${tattoos.length} tattoos`);
    
    if (tattoos.length === 0) {
      console.log('No tattoos to migrate');
      return;
    }

    // Check if any already have non-zero displayOrder
    const alreadyOrdered = tattoos.filter(t => t.displayOrder && t.displayOrder > 0);
    if (alreadyOrdered.length > 0) {
      console.log(`⚠️  Warning: ${alreadyOrdered.length} tattoos already have displayOrder values`);
      console.log('Existing ordered items:', alreadyOrdered.map(t => `${t.title} (order: ${t.displayOrder})`));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Continue and overwrite existing order? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Migration cancelled by user');
        return;
      }
    }

    // Assign sequential displayOrder starting from 1
    let updateCount = 0;
    for (let i = 0; i < tattoos.length; i++) {
      const tattoo = tattoos[i];
      const newOrder = i + 1; // 1-based indexing
      
      await Tattoo.findByIdAndUpdate(
        tattoo._id, 
        { displayOrder: newOrder },
        { runValidators: false } // Skip validation for migration
      );
      
      console.log(`  ${newOrder}. ${tattoo.title} (created: ${tattoo.createdAt.toISOString().split('T')[0]})`);
      updateCount++;
    }
    
    console.log(`✅ Updated ${updateCount} tattoos with displayOrder`);
  } catch (error) {
    console.error('❌ Error migrating tattoos:', error.message);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Check inspirations
    const inspirationStats = await Inspiration.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withOrder: { $sum: { $cond: [{ $gt: ['$displayOrder', 0] }, 1, 0] } },
          maxOrder: { $max: '$displayOrder' },
          minOrder: { $min: '$displayOrder' }
        }
      }
    ]);
    
    if (inspirationStats.length > 0) {
      const stats = inspirationStats[0];
      console.log(`Inspirations: ${stats.withOrder}/${stats.total} have displayOrder (range: ${stats.minOrder}-${stats.maxOrder})`);
    }
    
    // Check tattoos
    const tattooStats = await Tattoo.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withOrder: { $sum: { $cond: [{ $gt: ['$displayOrder', 0] }, 1, 0] } },
          maxOrder: { $max: '$displayOrder' },
          minOrder: { $min: '$displayOrder' }
        }
      }
    ]);
    
    if (tattooStats.length > 0) {
      const stats = tattooStats[0];
      console.log(`Tattoos: ${stats.withOrder}/${stats.total} have displayOrder (range: ${stats.minOrder}-${stats.maxOrder})`);
    }
    
    console.log('✅ Migration verification complete');
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting displayOrder migration...');
  console.log('This will assign sequential order numbers to existing records');
  console.log('Current display order (newest first) will be preserved\n');
  
  try {
    await connectDatabase();
    await migrateInspirations();
    await migrateTattoos();
    await verifyMigration();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('Next steps:');
    console.log('1. Update services to use displayOrder in queries');
    console.log('2. Add reorder API endpoints');
    console.log('3. Implement drag-and-drop UI');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { main, migrateInspirations, migrateTattoos };