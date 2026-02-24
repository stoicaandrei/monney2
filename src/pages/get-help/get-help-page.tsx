'use client'

import * as React from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AppSidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function GetHelpPage() {
  const [name, setName] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const createHelpMessage = useMutation(api.helpMessages.create)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      toast.error('Please fill in both name and message')
      return
    }
    try {
      await createHelpMessage({ name: name.trim(), message: message.trim() })
      setIsSubmitted(true)
      setName('')
      setMessage('')
      toast.success('Message sent successfully!')
    } catch {
      toast.error('Failed to send message. Please try again.')
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Get Help" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Get Help
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    You can email me directly at{' '}
                    <a
                      href="mailto:andrei@stoica.dev"
                      className="text-primary hover:underline font-medium"
                    >
                      andrei@stoica.dev
                    </a>
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Or leave a message directly</CardTitle>
                    <CardDescription>
                      Send me a message and I&apos;ll get back to you as soon as possible
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSubmitted ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-200">
                          Thank you! Your message has been sent successfully. I&apos;ll get back to you soon.
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setIsSubmitted(false)}
                        >
                          Send another message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <FieldGroup className="space-y-4">
                          <Field>
                            <FieldLabel htmlFor="name">Name</FieldLabel>
                            <Input
                              id="name"
                              placeholder="Your name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="message">Message</FieldLabel>
                            <Textarea
                              id="message"
                              placeholder="Your message..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              rows={5}
                              required
                            />
                          </Field>
                          <Button type="submit">Send Message</Button>
                        </FieldGroup>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
