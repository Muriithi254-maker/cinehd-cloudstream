const { Extension, Http, Models } = require('cssource');

class CineHD extends Extension {
    constructor() {
        super({
            name: "CineHD",
            baseUrl: "https://cinehd.app",
            lang: "en",
            type: "movie"
        });
    }

    async getHomePage() {
        const response = await Http.get(this.baseUrl);
        const document = response.document;
        const items = [];
        document.querySelectorAll('.post-item, .card').forEach(element => {
            const title = element.querySelector('.title')?.text?.trim();
            const url = element.querySelector('a')?.getAttribute('href');
            const poster = element.querySelector('img')?.getAttribute('src');
            if (title && url) {
                items.push(new Models.SearchResponse({
                    name: title,
                    url: this.fixUrl(url),
                    posterUrl: this.fixUrl(poster),
                }));
            }
        });
        return [new Models.HomePageResult("Popular", items)];
    }

    async search(query) {
        const response = await Http.get(`${this.baseUrl}/?s=${encodeURIComponent(query)}`);
        const document = response.document;
        const results = [];
        document.querySelectorAll('.search-result, .card').forEach(element => {
            const title = element.querySelector('.title')?.text?.trim();
            const url = element.querySelector('a')?.getAttribute('href');
            const poster = element.querySelector('img')?.getAttribute('src');
            if (title && url) {
                results.push(new Models.SearchResponse({
                    name: title,
                    url: this.fixUrl(url),
                    posterUrl: this.fixUrl(poster),
                }));
            }
        });
        return results;
    }

    async getDetails(url) {
        const response = await Http.get(url);
        const document = response.document;
        const title = document.querySelector('.movie-title')?.text?.trim();
        const description = document.querySelector('.description')?.text?.trim();
        const poster = document.querySelector('.poster img')?.getAttribute('src');
        const episodes = [];
        const iframeSrc = document.querySelector('iframe')?.getAttribute('src');
        if (iframeSrc) {
            episodes.push(new Models.Episode({ name: title, url: this.fixUrl(iframeSrc) }));
        }
        return new Models.TvSeriesDetail({
            name: title,
            description: description,
            posterUrl: this.fixUrl(poster),
            episodes: episodes
        });
    }

    async getStreamUrls(url) {
        const response = await Http.get(url);
        const pageContent = response.body;
        const streams = [];
        const m3u8Match = pageContent.match(/(https?:\/\/.*?\.m3u8)/);
        if (m3u8Match) {
            streams.push(new Models.Stream({ url: m3u8Match[1], quality: "Auto", isM3u8: true }));
        }
        return streams;
    }

    fixUrl(url) {
        if (!url) return "";
        if (url.startsWith('//')) return `https:${url}`;
        if (url.startsWith('/')) return `${this.baseUrl}${url}`;
        return url;
    }
}
module.exports = CineHD;
