import type { BilingualValue } from "./bilingual";

export const SHARED_UI_COPY: {
  languageSelectorAria: BilingualValue;
  comingSoon: BilingualValue;
  retry: BilingualValue;
  emptyState: {
    title: BilingualValue;
    body: BilingualValue;
  };
  genericError: {
    title: BilingualValue;
    body: BilingualValue;
  };
} = {
  languageSelectorAria: {
    en: "Language selector",
    vi: "Bộ chọn ngôn ngữ",
  },
  comingSoon: {
    en: "Coming soon",
    vi: "Sắp ra mắt",
  },
  retry: {
    en: "Try again",
    vi: "Thử lại",
  },
  emptyState: {
    title: {
      en: "No data yet",
      vi: "Chưa có dữ liệu",
    },
    body: {
      en: "This section will appear when data becomes available.",
      vi: "Mục này sẽ hiển thị khi có dữ liệu.",
    },
  },
  genericError: {
    title: {
      en: "Something went wrong",
      vi: "Đã xảy ra lỗi",
    },
    body: {
      en: "Please retry in a few moments.",
      vi: "Vui lòng thử lại sau ít phút.",
    },
  },
};
