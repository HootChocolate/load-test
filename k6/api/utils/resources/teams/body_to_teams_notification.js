export const body_teams = {
    "type": "AdaptiveCard",
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "attachments": [
        {
            "contentType": "application/vnd.microsoft.card.adaptive",
            "content": {
                "type": "AdaptiveCard",
                "version": "1.2",
                "msteams": {
                    "width": "Full"
                },
                "body": [
                    {
                        "type": "TextBlock",
                        "text": "k6 - Monitoramento de API",
                        "style": "heading"
                    },
                    {
                        "type": "CodeBlock",
                        "codeSnippet": "${MESSAGE}",
                        "language": "bash",
                        "startLineNumber": 1
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Realm Name: ",
                                        "weight": "Bolder"
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "${REALM}"
                                    }
                                ]
                            }
                        ],
                        "spacing": "None"
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Test Context: ",
                                        "weight": "Bolder"
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "${TEST_CONTEXT}"
                                    }
                                ]
                            }
                        ],
                        "spacing": "None"
                    }
                ]
            }
        }
    ]
}

export default {
    body_teams
}
