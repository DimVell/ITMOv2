# Design: subscriber logic

`SubscriberStore` владеет нормализацией, уникальностью, сортировкой и атомарной записью.
`NotifyHandler` переводит HTTP в операции store и формирует только ответы из общего
контракта. Store внедряется в server, поэтому тесты используют память или временный файл.

```mermaid
sequenceDiagram
    participant UI
    participant HTTP as NotifyHandler
    participant Store as SubscriberStore
    participant JSON as JSON file
    UI->>HTTP: POST /api/subscribers {name}
    HTTP->>Store: add(name)
    Store->>Store: normalize + casefold lookup
    alt new name
        Store->>JSON: atomic replace
        Store-->>HTTP: name, created=true
        HTTP-->>UI: 201 response
    else duplicate
        Store-->>HTTP: original name, created=false
        HTTP-->>UI: 200 response
    else invalid
        HTTP-->>UI: 400 structured error
    end
```

Потокобезопасность внутри процесса обеспечивается `RLock`; это не обещает распределённую
согласованность и соответствует узким границам учебного сервиса.

