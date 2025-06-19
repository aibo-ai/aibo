/**
 * Type definitions for SERP API responses
 */

export interface SerpApiResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    google_domain: string;
    hl: string;
    gl: string;
    device: string;
  };
  search_information: {
    organic_results_state: string;
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
  };
  organic_results: SerpApiOrganicResult[];
  news_results?: SerpApiNewsResult[];
  pagination?: {
    current: number;
    next: string | null;
    other_pages?: Record<string, string>;
  };
  serpapi_pagination?: {
    current: number;
    next_link: string | null;
    next: string | null;
  };
}

export interface SerpApiOrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  favicon: string;
  snippet: string;
  snippet_highlighted_words: string[];
  sitelinks?: {
    inline: {
      link: string;
      title: string;
    }[];
  };
  about_this_result?: {
    source: {
      description: string;
      source_info_link: string;
      security: string;
    };
  };
  about_page_link?: string;
  about_page_serpapi_link?: string;
  cached_page_link?: string;
  date?: string;
  source?: string;
}

export interface SerpApiNewsResult extends Omit<SerpApiOrganicResult, 'snippet_highlighted_words' | 'sitelinks'> {
  date: string;
  source: string;
  snippet: string;
  thumbnail?: string;
}

export interface SerpSearchOptions {
  limit?: number;
  region?: string;
  language?: string;
  timeframe?: string;
  safeSearch?: boolean;
  tbs?: string;
}
