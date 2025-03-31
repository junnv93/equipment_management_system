"use client"

import { useMemo, memo } from "react"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { IconType } from "react-icons"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsCardProps {
  title: string
  value: number
  description?: string
  loading?: boolean
  icon?: IconType
  variant?: "default" | "success" | "warning" | "danger" | "primary"
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  description,
  loading = false,
  icon: Icon,
  variant = "default"
}: StatsCardProps) {
  // variant에 따른 색상 스타일 지정 - useMemo로 최적화
  const variantClasses = useMemo(() => {
    switch (variant) {
      case "success":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
      case "danger":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
      case "primary":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900"
      default:
        return "bg-card text-card-foreground border-border"
    }
  }, [variant]);

  // 아이콘 색상 스타일 지정 - useMemo로 최적화
  const iconClasses = useMemo(() => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
      case "warning":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
      case "danger":
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
      case "primary":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
      default:
        return "bg-muted text-muted-foreground dark:bg-gray-800 dark:text-gray-300"
    }
  }, [variant]);

  return (
    <Card 
      className={`${variantClasses} border transition-all duration-300 hover:shadow-md dark:hover:shadow-lg dark:shadow-gray-900/10 hover:translate-y-[-2px]`}
      hoverable
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <p className="text-sm font-medium leading-none">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1 transition-colors" data-testid="stats-value">
                {value.toLocaleString()}
              </p>
            )}
            {description && (
              <CardDescription className="mt-2 dark:text-gray-400">{description}</CardDescription>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${iconClasses} transition-all duration-300`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}); 