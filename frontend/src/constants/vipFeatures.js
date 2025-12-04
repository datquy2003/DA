const FEATURE_KEYS = {
  CANDIDATE_COMPETITOR_INSIGHT: "CANDIDATE_COMPETITOR_INSIGHT",
  EMPLOYER_REVEAL_PHONE: "EMPLOYER_REVEAL_PHONE",
};

const ONE_TIME_FEATURES = {
  3: [
    {
      key: FEATURE_KEYS.EMPLOYER_REVEAL_PHONE,
      title: "Hiển thị số điện thoại ứng viên",
      apiPath: "/api/vip-features/employer/reveal-contact",
      description:
        "Mở khóa số điện thoại của ứng viên đang cho phép nhà tuyển dụng xem thông tin.",
      suggestedName: "Mở khóa số điện thoại ứng viên",
      suggestedFeatures:
        "Hiển thị tức thì số điện thoại ứng viên\n Sử dụng một lần cho mỗi lượt mua",
    },
  ],
  4: [
    {
      key: FEATURE_KEYS.CANDIDATE_COMPETITOR_INSIGHT,
      title: "Xem số lượng ứng viên đã ứng tuyển",
      apiPath: "/api/vip-features/candidate/application-insight",
      description:
        "Hiển thị tổng số ứng viên khác đã nộp hồ sơ vào tin còn hạn mà bạn đã ứng tuyển.",
      suggestedName: "Mua lượt xem số người cùng ứng tuyển",
      suggestedFeatures:
        "Thống kê số lượng ứng viên cạnh tranh\n Sử dụng một lần cho mỗi lượt mua",
    },
  ],
};

export { FEATURE_KEYS, ONE_TIME_FEATURES };