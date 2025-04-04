require('dotenv').config();
const { validateEnv } = require('./src/utils/envValidation');
const pubmedService = require('./src/services/pubmedService');
const csvService = require('./src/services/csvService');
const { PUBLICATION_YEARS, SEARCH_TERMS } = require('./src/config');

// Validate environment variables before starting
validateEnv();

async function searchPubMed() {
    try {
        console.log('\n🔍 Starting PubMed search for:', SEARCH_TERMS.QUERY);
        console.log(`📅 Filtering for ${SEARCH_TERMS.PUBLICATION_TYPES.join(' and ')} from ${PUBLICATION_YEARS.START}-${PUBLICATION_YEARS.END}\n`);

        const startTime = Date.now();

        // Search for articles
        const ids = await pubmedService.searchArticles();
        console.log(`\n📊 Found ${ids.length} matching articles`);

        // Fetch article details
        const articles = await pubmedService.fetchArticleDetails(ids);
        
        // Process articles and extract author information
        console.log(`\n📚 Processing ${articles.length} articles...`);
        const authorMap = pubmedService.extractAuthorInfo(articles);
        
        // Create and write CSV file
        console.log('\n📊 Statistics:');
        console.log(`   📝 Total unique authors: ${authorMap.size}`);
        
        console.log('\n💾 Creating CSV file...');
        const csvContent = csvService.createCSVContent(authorMap);
        const outputFile = csvService.writeToFile(csvContent, SEARCH_TERMS.QUERY);
        
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n✅ Process completed successfully!');
        console.log('📁 Results saved to:', outputFile);
        console.log(`⏱️  Total execution time: ${totalTime} seconds\n`);
        
    } catch (error) {
        console.error('\n❌ Error occurred:');
        console.error('   ', error.message);
        if (error.response) {
            console.error('📡 API Response Status:', error.response.status);
            console.error('📄 API Response Data:', error.response.data);
            if (error.response.status === 429) {
                console.error('⚠️  You have exceeded the API rate limit. Please wait a few seconds and try again.');
            }
        } else if (error.request) {
            console.error('🌐 No response received from the server');
        }
        process.exit(1);
    }
}

console.log('🚀 PubMed Author Extraction Tool');
console.log('================================\n');
searchPubMed()
    .then(() => console.log('👋 Search completed. Have a great day!\n'))
    .catch(err => console.error('❌ Failed to complete search:', err));