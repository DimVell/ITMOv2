# Design: subscriber UI

UI состоит из формы, live-status, счётчика и списка. Источник истины — ответы API по
[`common-contract.md`](../../../specs/common-contract.md); после успешного POST список
перечитывается, поэтому optimistic state не расходится с backend.

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Ready: GET 200
    Loading --> Error: GET error
    Ready --> Submitting: submit name
    Submitting --> Ready: POST 200/201, reload list
    Submitting --> Error: POST error
    Error --> Submitting: corrected submit
```

Решение по доступности: `label` связан с input; сообщения объявляются через `role=status` и
`aria-live`; native button получает `disabled` только на время запроса.

