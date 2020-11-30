import nltk

from pyresparser import ResumeParser

import sys
import json

try:
    # get the 2nd index
    cvPath = sys.argv[1]

    # strip
    data = ResumeParser(cvPath).get_extracted_data()

    # print to return result
    print(json.dumps(data))

except:
    print('ERR_CONNECTION')

sys.stdout.flush()
