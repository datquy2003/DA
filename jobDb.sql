CREATE DATABASE JOB_APPLICATION
GO

USE [JOB_APPLICATION]
GO

/* ----------------------------------------------------------------
  NHÓM 1: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
----------------------------------------------------------------
*/

-- Bảng 1: Roles (Phân quyền)
CREATE TABLE Roles (
	RoleID int IDENTITY(1,1) PRIMARY KEY,
    RoleName nvarchar(50) UNIQUE NOT NULL 
    -- 1: Admin, 2: SuperAdmin, 3: Employer, 4: Candidate
);
GO

-- Bảng 2: Users (Người dùng)
CREATE TABLE Users (
    FirebaseUserID nvarchar(128) PRIMARY KEY NOT NULL,
    Email nvarchar(100) UNIQUE NOT NULL,
    DisplayName nvarchar(100) NOT NULL,
    RoleID int NOT NULL,
    PhotoURL nvarchar(MAX),
    IsVerified bit DEFAULT 0,
    IsBanned bit DEFAULT 0,
    CreatedAt datetime DEFAULT GETDATE(),
    UpdatedAt datetime,
    LastLoginAt datetime,
    
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

-- Bảng 3: UserProviders (Liên kết Google, Facebook)
CREATE TABLE UserProviders (
    FirebaseUserID nvarchar(128) NOT NULL,
    ProviderID nvarchar(100) NOT NULL, -- vd: 'google.com', 'facebook.com'
    ProviderUID nvarchar(255) NOT NULL,
    LinkedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT PK_UserProviders PRIMARY KEY (FirebaseUserID, ProviderID),
    CONSTRAINT FK_UserProviders_Users FOREIGN KEY (FirebaseUserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE
);
GO

/* ----------------------------------------------------------------
  NHÓM 2: DANH MỤC, CHUYÊN MÔN & HỒ SƠ
----------------------------------------------------------------
*/

-- Bảng 4: Categories (Danh mục Ngành nghề)
CREATE TABLE Categories (
    CategoryID int IDENTITY(1,1) PRIMARY KEY,
    CategoryName nvarchar(100) NOT NULL
);
GO

-- Bảng 5: Specializations (Chuyên môn)
CREATE TABLE Specializations (
    SpecializationID int IDENTITY(1,1) PRIMARY KEY,
    CategoryID int NOT NULL,
    SpecializationName nvarchar(100) NOT NULL,
    
    CONSTRAINT FK_Specializations_Categories 
        FOREIGN KEY (CategoryID) 
        REFERENCES Categories(CategoryID) 
        ON DELETE CASCADE
);
GO

-- Bảng 6: CandidateProfiles (Hồ sơ Ứng viên DẠNG CÓ CẤU TRÚC)
CREATE TABLE CandidateProfiles (
    UserID nvarchar(128) PRIMARY KEY NOT NULL,
    SpecializationID int, -- Chuyên môn chính của ứng viên
    FullName nvarchar(100),
    PhoneNumber nvarchar(20),
    Birthday date,
    Address nvarchar(255),
    ProfileSummary ntext,
    IsSearchable bit DEFAULT 0, 
    
    CONSTRAINT FK_CandidateProfiles_Users FOREIGN KEY (UserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE,
    CONSTRAINT FK_CandidateProfiles_Specializations FOREIGN KEY (SpecializationID) REFERENCES Specializations(SpecializationID)
);
GO

-- Bảng 7: Companies (Thông tin Công ty)
CREATE TABLE Companies (
    CompanyID int IDENTITY(1,1) PRIMARY KEY,
    OwnerUserID nvarchar(128) NOT NULL UNIQUE, 
    CompanyName nvarchar(255) NOT NULL,
    CompanyEmail nvarchar(100),
    CompanyPhone nvarchar(20),
    WebsiteURL nvarchar(255),
    LogoURL nvarchar(MAX),
    CompanyDescription ntext,
    Address nvarchar(255),
    City nvarchar(100),
    Country nvarchar(100),
    Latitude decimal(9, 6),
    Longitude decimal(9, 6),
    
    CONSTRAINT FK_Companies_Users FOREIGN KEY (OwnerUserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE
);
GO

/* ----------------------------------------------------------------
  NHÓM 3: QUẢN LÝ VIỆC LÀM & CV
----------------------------------------------------------------
*/

-- Bảng 8: CVs (Quản lý CÁC TỆP CV của Ứng viên)
CREATE TABLE CVs (
    CVID int IDENTITY(1,1) PRIMARY KEY,
    UserID nvarchar(128) NOT NULL,
    CVName nvarchar(100) NOT NULL,
    CVFileUrl nvarchar(MAX) NOT NULL, 
    IsDefault bit DEFAULT 0,
    CreatedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT FK_CVs_Users FOREIGN KEY (UserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE
);
GO

-- Bảng 9: Jobs (Tin tuyển dụng)
CREATE TABLE Jobs (
    JobID int IDENTITY(1,1) PRIMARY KEY,
    CompanyID int NOT NULL,
    CategoryID int,
    SpecializationID int,
    JobTitle nvarchar(255) NOT NULL,
    JobDescription ntext NOT NULL,
    Requirements ntext,
    SalaryMin decimal(18, 2),
    SalaryMax decimal(18, 2),
    Location nvarchar(255),
    JobType nvarchar(50), 
    
    -- CẬP NHẬT: Status kiểu TINYINT
    -- 0: Chờ duyệt, 1: Đang tuyển, 2: Đã hết hạn, 3: Đã đóng
    Status TINYINT NOT NULL DEFAULT 0, 
    
    IsVIP bit DEFAULT 0,
    CreatedAt datetime DEFAULT GETDATE(),
    ApprovedAt datetime,
    ExpiresAt datetime NOT NULL,
    
    CONSTRAINT FK_Jobs_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID) ON DELETE CASCADE,
    CONSTRAINT FK_Jobs_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT FK_Jobs_Specializations FOREIGN KEY (SpecializationID) REFERENCES Specializations(SpecializationID)
);
GO

/* ----------------------------------------------------------------
  NHÓM 4: QUẢN LÝ TƯƠNG TÁC
----------------------------------------------------------------
*/

-- Bảng 10: Applications (Đơn ứng tuyển)
CREATE TABLE Applications (
    ApplicationID int IDENTITY(1,1) PRIMARY KEY,
    JobID int NOT NULL,
    CandidateID nvarchar(128) NOT NULL,
    CVID int NOT NULL,
    AppliedAt datetime DEFAULT GETDATE(),
    
    -- CẬP NHẬT: CurrentStatus kiểu TINYINT
    -- 0: Đã apply, 1: NTD đã xem, 2: Phù hợp, 3: Chưa phù hợp
    CurrentStatus TINYINT NOT NULL DEFAULT 0, 
    
    StatusUpdatedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT FK_Applications_Jobs FOREIGN KEY (JobID) REFERENCES Jobs(JobID),
    CONSTRAINT FK_Applications_Users FOREIGN KEY (CandidateID) REFERENCES Users(FirebaseUserID),
    CONSTRAINT FK_Applications_CVs FOREIGN KEY (CVID) REFERENCES CVs(CVID)
);
GO

-- Bảng 11: ApplicationStatusHistory (Lịch sử Trạng thái Ứng tuyển)
CREATE TABLE ApplicationStatusHistory (
    HistoryID int IDENTITY(1,1) PRIMARY KEY,
    ApplicationID int NOT NULL,
    
    -- CẬP NHẬT: Status kiểu TINYINT
    -- 0: Đã apply, 1: NTD đã xem, 2: Phù hợp, 3: Chưa phù hợp
    Status TINYINT NOT NULL,
    
    ChangedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT FK_ApplicationStatusHistory_Applications 
        FOREIGN KEY (ApplicationID) 
        REFERENCES Applications(ApplicationID) 
        ON DELETE CASCADE
);
GO

-- Bảng 12: SavedJobs (Công việc đã lưu)
CREATE TABLE SavedJobs (
    UserID nvarchar(128) NOT NULL,
    JobID int NOT NULL,
    SavedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT PK_SavedJobs PRIMARY KEY (UserID, JobID),
    CONSTRAINT FK_SavedJobs_Users FOREIGN KEY (UserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE,
    CONSTRAINT FK_SavedJobs_Jobs FOREIGN KEY (JobID) REFERENCES Jobs(JobID) ON DELETE NO ACTION
);
GO

-- Bảng 13: BlockedCompanies (Chặn công ty)
CREATE TABLE BlockedCompanies (
    UserID nvarchar(128) NOT NULL,
    CompanyID int NOT NULL,
    BlockedAt datetime DEFAULT GETDATE(),

    CONSTRAINT PK_BlockedCompanies PRIMARY KEY (UserID, CompanyID),
    CONSTRAINT FK_BlockedCompanies_Users FOREIGN KEY (UserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE,
    CONSTRAINT FK_BlockedCompanies_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID) ON DELETE NO ACTION
);
GO

-- Bảng 14: Notifications (Thông báo)
CREATE TABLE Notifications (
    NotificationID int IDENTITY(1,1) PRIMARY KEY,
    UserID nvarchar(128) NOT NULL,
    Message nvarchar(500) NOT NULL,
    LinkURL nvarchar(MAX), 
    IsRead bit DEFAULT 0,
    CreatedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserID) REFERENCES Users(FirebaseUserID) ON DELETE CASCADE
);
GO

/* ----------------------------------------------------------------
  NHÓM 5: TÍNH NĂNG NÂNG CAO (VIP, LOGS)
----------------------------------------------------------------
*/

-- Bảng 15: SubscriptionPlans (Các Gói VIP)
CREATE TABLE SubscriptionPlans (
    PlanID int IDENTITY(1,1) PRIMARY KEY,
    PlanName nvarchar(100) NOT NULL,
    RoleID int NOT NULL, 
    Price decimal(18, 2) NOT NULL,
    DurationInDays int NOT NULL,
    Features ntext, 
    
    CONSTRAINT FK_SubscriptionPlans_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

-- Bảng 16: UserSubscriptions (Lịch sử Đăng ký VIP)
CREATE TABLE UserSubscriptions (
    SubscriptionID int IDENTITY(1,1) PRIMARY KEY,
    UserID nvarchar(128) NOT NULL,
    PlanID int NOT NULL,
    StartDate datetime NOT NULL,
    EndDate datetime NOT NULL,
    PaymentTransactionID nvarchar(255),
    
    -- CẬP NHẬT: Status kiểu TINYINT
    -- 0: Chờ thanh toán, 1: Đang hoạt động, 2: Hết hạn, 3: Đã hủy
    Status TINYINT NOT NULL DEFAULT 0, 
    
    CONSTRAINT FK_UserSubscriptions_Users FOREIGN KEY (UserID) REFERENCES Users(FirebaseUserID),
    CONSTRAINT FK_UserSubscriptions_Plans FOREIGN KEY (PlanID) REFERENCES SubscriptionPlans(PlanID)
);
GO

-- Bảng 17: CVViews (Log NTD xem CV)
CREATE TABLE CVViews (
    ViewID int IDENTITY(1,1) PRIMARY KEY,
    CandidateID nvarchar(128) NOT NULL,
    EmployerID nvarchar(128) NOT NULL, 
    ViewedAt datetime DEFAULT GETDATE(),
    
    CONSTRAINT FK_CVViews_Candidate FOREIGN KEY (CandidateID) REFERENCES Users(FirebaseUserID),
    CONSTRAINT FK_CVViews_Employer FOREIGN KEY (EmployerID) REFERENCES Users(FirebaseUserID)
);
GO

-- Thêm dữ liệu cho bảng Roles
INSERT INTO Roles (RoleName) VALUES 
('Admin'),        -- 1
('SuperAdmin'),   -- 2
('Employer'),     -- 3
('Candidate');    -- 4
GO

SELECT * FROM Roles ORDER BY RoleID;
GO