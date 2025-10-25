$env:PGPASSWORD = "YeBhLWVVMGLnRklInXBQWSVpggsLmcyd"
psql "postgresql://postgres:YeBhLWVVMGLnRklInXBQWSVpggsLmcyd@switchback.proxy.rlwy.net:56643/railway?sslmode=require" -f momentum_emr_backup.sql
