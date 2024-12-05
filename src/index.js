const { simpleParser } = require('mailparser');
const cheerio = require('cheerio')
var fs = require('fs'), fileStream;

var Imap = require('imap'),
  inspect = require('util').inspect;
var imap = new Imap({
  user: 'brand.beru@gmail.com',
  password: 'pjuq svza lquq pxlo',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

const getEmaiInformation = () => {
  imap.once('ready', function () {
    openInbox(function (err, box) {
      if (err) throw err;
      imap.search(['UNSEEN', ['SINCE', 'Dec 01, 2024']], (err, results) => {
        if (err || !results.length) return imap.end();

        var f = imap.fetch(results, { bodies: '', struct: true });
        f.on('message', (msg, seqno) => {
          console.log('Message #%d', seqno);
          var prefix = '(#' + seqno + ') ';

          const regex = /<table[^>]*>[\s\S]*?<\/table>/g;

          msg.on('body', function (stream, info) {
            simpleParser(stream, async (err, parsed) => {
              const date = parsed.date;
              if (date >= new Date('2024-12-03T19:20:00Z')) {
                //console.log("Header"+JSON.stringify(parsed.header))
                console.log(parsed.subject)
                console.log(parsed.date)
                let matches;
                const values = []
                while((matches = regex.exec(parsed.text)) !== null){
                  values.push(matches[0])
                }
                //console.log(values)
                if(values[0] === undefined) return;
                const $ = cheerio.load(values[0])

                const headersArray = [];
                $('table').each((index, table) => {
                  const headers = []
                  $(table).find('tr').first().find('th').each((i, th) => {
                    headers.push($(th).html());
                  })
                  headersArray.push(headers)
                })

                console.log('Headers: ',headersArray)

                //if(headersArray[0] !== '')

                const firstRow = $('table tr').eq(1).find('td');

                const firstValues = []
                firstRow.each((index, element) => {
                  firstValues.push($(element).text());
                })

                console.log("First Value: ", firstValues)
              }
            })
          });
          msg.once('attributes', function (attrs) {
            //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
          });
          msg.once('end', function () {
            console.log(prefix, 'Finished')
          });
        });
        f.once('error', function (err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function () {
          console.log('Done fetching all messages!');
          imap.end();
        });
      })
    });
  });

  imap.once('error', function (err) {
    console.log(err);
  });

  imap.once('end', function () {
    console.log('Connection ended');
  });
}

setTimeout(() => {
  getEmaiInformation()
  imap.connect()
}, 1000)