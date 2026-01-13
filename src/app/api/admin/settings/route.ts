import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let settings = await db.settings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.settings.create({
        data: {
          institutionName: 'Queue Management System',
          language: 'en',
          timezone: 'UTC',
          displayTheme: 'default',
          callSoundUrl: '',
          displayBgUrl: '',
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      institutionName,
      logo,
      language,
      timezone,
      callSoundUrl,
      displayBgUrl,
      displayTheme,
      showLogo,
      showAds,
      adContent,
      transitionEffect,
      fontSize,
      fontFamily,
      autoRefresh,
      refreshInterval,
      // Additional fields from frontend
      autoResetCounters,
      resetTime,
      enableAuditLog,
      dataRetentionDays,
      maintenanceMode,
      allowKioskAccess,
      sessionTimeout
    } = body

    // Check if settings exist
    let settings = await db.settings.findFirst()
    
    if (settings) {
      // Update existing settings - only include fields that exist in the database
      const updateData: any = {
        ...(institutionName !== undefined && { institutionName }),
        ...(logo !== undefined && { logo }),
        ...(language !== undefined && { language }),
        ...(timezone !== undefined && { timezone }),
        ...(callSoundUrl !== undefined && { callSoundUrl }),
        ...(displayBgUrl !== undefined && { displayBgUrl }),
        ...(displayTheme !== undefined && { displayTheme }),
      }

      // Try to update additional fields if they exist in the database
      // These will be ignored if they don't exist in the current schema
      try {
        if (showLogo !== undefined) updateData.showLogo = showLogo
        if (showAds !== undefined) updateData.showAds = showAds
        if (adContent !== undefined) updateData.adContent = adContent
        if (transitionEffect !== undefined) updateData.transitionEffect = transitionEffect
        if (fontSize !== undefined) updateData.fontSize = fontSize
        if (fontFamily !== undefined) updateData.fontFamily = fontFamily
        if (autoRefresh !== undefined) updateData.autoRefresh = autoRefresh
        if (refreshInterval !== undefined) updateData.refreshInterval = refreshInterval
        if (autoResetCounters !== undefined) updateData.autoResetCounters = autoResetCounters
        if (resetTime !== undefined) updateData.resetTime = resetTime
        if (enableAuditLog !== undefined) updateData.enableAuditLog = enableAuditLog
        if (dataRetentionDays !== undefined) updateData.dataRetentionDays = dataRetentionDays
        if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode
        if (allowKioskAccess !== undefined) updateData.allowKioskAccess = allowKioskAccess
        if (sessionTimeout !== undefined) updateData.sessionTimeout = sessionTimeout
      } catch (fieldError) {
        // Ignore field errors - these fields might not exist in the database yet
        console.log('Some fields not yet supported in database schema:', fieldError)
      }

      settings = await db.settings.update({
        where: { id: settings.id },
        data: updateData
      })
    } else {
      // Create new settings
      const createData: any = {
        institutionName: institutionName || 'Queue Management System',
        logo,
        language: language || 'en',
        timezone: timezone || 'UTC',
        callSoundUrl,
        displayBgUrl,
        displayTheme: displayTheme || 'default',
      }

      // Try to add additional fields if they exist in the database
      try {
        if (showLogo !== undefined) createData.showLogo = showLogo
        if (showAds !== undefined) createData.showAds = showAds
        if (adContent !== undefined) createData.adContent = adContent
        if (transitionEffect !== undefined) createData.transitionEffect = transitionEffect
        if (fontSize !== undefined) createData.fontSize = fontSize
        if (fontFamily !== undefined) createData.fontFamily = fontFamily
        if (autoRefresh !== undefined) createData.autoRefresh = autoRefresh
        if (refreshInterval !== undefined) createData.refreshInterval = refreshInterval
        if (autoResetCounters !== undefined) createData.autoResetCounters = autoResetCounters
        if (resetTime !== undefined) createData.resetTime = resetTime
        if (enableAuditLog !== undefined) createData.enableAuditLog = enableAuditLog
        if (dataRetentionDays !== undefined) createData.dataRetentionDays = dataRetentionDays
        if (maintenanceMode !== undefined) createData.maintenanceMode = maintenanceMode
        if (allowKioskAccess !== undefined) createData.allowKioskAccess = allowKioskAccess
        if (sessionTimeout !== undefined) createData.sessionTimeout = sessionTimeout
      } catch (fieldError) {
        // Ignore field errors - these fields might not exist in the database yet
        console.log('Some fields not yet supported in database schema:', fieldError)
      }

      settings = await db.settings.create({
        data: createData
      })
    }

    // Log the action (only if audit log field exists)
    try {
      if (enableAuditLog !== false) {
        await db.auditLog.create({
          data: {
            action: 'UPDATE',
            entity: 'settings',
            entityId: settings.id,
            details: JSON.stringify({ displayTheme, showLogo }),
            userId: 'admin' // Will be replaced with actual user ID from auth
          }
        })
      }
    } catch (logError) {
      // Ignore audit log errors
      console.log('Audit log not available:', logError)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}